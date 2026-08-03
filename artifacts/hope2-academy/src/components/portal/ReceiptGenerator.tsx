/**
 * ReceiptGenerator — printable financial receipts for HOPE2 ACADEMY
 *
 * Provides three document types:
 *   FeeReceiptModal     — student tuition / fee payment receipt
 *   ExpenseVoucherModal — vendor / operating expense payment voucher
 *   PayslipModal        — staff salary / payroll payslip
 *
 * Each modal shows a live in-browser preview and a Print / PDF button.
 * The print HTML is self-contained (no external resources) for offline use.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Plus, Edit3, Trash2, Search, Receipt } from "lucide-react";
import { toast } from "sonner";
import { apiClient, isNetworkError } from "@/lib/api-client";
import { mockDb } from "@/lib/mock-backend";
import { scopeRows, stampOwner, type Principal } from "@/lib/rbac";
import { approvalsStore } from "@/lib/approvals";
import { motion } from "@/components/Motion";
import { useAuth } from "@/hooks/use-auth";

// Build a Principal from the signed-in user (mirrors usePrincipal in portal.m.$key.tsx)
function usePrincipalLocal(): Principal | null {
  const { profile, primaryRole } = useAuth();
  if (!profile) return null;
  return {
    id: profile.$id,
    name: profile.full_name ?? profile.email ?? "",
    email: profile.email,
    role: primaryRole,
    class_name: (profile as any).class_name ?? null,
    grade: (profile as any).grade ?? null,
    linked_children: (profile as any).linked_children ?? null,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LRD_KEY = "h2l.fx.lrd_per_usd";
function getLrdRate(): number {
  if (typeof localStorage === "undefined") return 200;
  const v = Number(localStorage.getItem(LRD_KEY));
  return v > 0 ? v : 200;
}
function fmtUSD(v: number | string) {
  const n = Number(v || 0);
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
function fmtLRD(v: number | string) {
  const n = Number(v || 0);
  const lrd = Math.round(n * getLrdRate());
  return `LRD ${lrd.toLocaleString()}`;
}
function fmtBoth(v: number | string) {
  return `${fmtUSD(v)} · ${fmtLRD(v)}`;
}

/** Deterministic short receipt number from a row id */
function makeReceiptNo(id: string, prefix = "RCP") {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return `${prefix}-${new Date().getFullYear()}-${String(Math.abs(h) % 1000000).padStart(6, "0")}`;
}

function today() {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function statusClass(s: string) {
  const t = String(s).toLowerCase();
  if (t === "paid" || t === "active") return "color:#0a7c3a;background:#d1fae5;";
  if (t === "outstanding" || t === "pending") return "color:#c0392b;background:#fee2e2;";
  return "color:#555;background:#f3f4f6;";
}

// ---------------------------------------------------------------------------
// Shared print styles (injected into every print window)
// ---------------------------------------------------------------------------
const PRINT_BASE = `
  @import url('https://fonts.googleapis.com/css2?family=Georgia&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; padding: 40px 48px; font-size: 13px; }
  h1  { font-size: 22px; font-weight: bold; letter-spacing: .5px; }
  h2  { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
  p   { line-height: 1.6; }
  .divider { border: none; border-top: 1px solid #d1d5db; margin: 16px 0; }
  .divider-bold { border: none; border-top: 2px solid #1a1a1a; margin: 16px 0; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { padding: 8px 10px; text-align: left; font-size: 12px; }
  th { background: #f3f0e8; border-bottom: 2px solid #ccc; font-weight: bold; }
  td { border-bottom: 1px solid #e5e7eb; }
  .total-row td { font-weight: bold; background: #fafaf7; border-top: 2px solid #ccc; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; letter-spacing: .5px; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 4px; }
  .flex  { display: flex; }
  .space-between { justify-content: space-between; }
  .gap-8 { gap: 32px; }
  .col { display: flex; flex-direction: column; }
  .mt-4 { margin-top: 16px; }
  .mt-8 { margin-top: 32px; }
  .text-right { text-align: right; }
  .watermark { position: fixed; bottom: 80px; right: 60px; font-size: 80px; font-weight: bold;
    color: rgba(0,0,0,0.04); transform: rotate(-25deg); pointer-events: none; }
  @media print { @page { margin: 1.5cm; } body { padding: 0; } .watermark { display: block; } }
`;

const SCHOOL_HEADER = (subtitle: string) => `
  <div class="flex space-between" style="align-items:flex-start;margin-bottom:18px">
    <div>
      <h1>HOPE2 ACADEMY</h1>
      <p style="color:#555;font-size:12px;margin-top:2px">Preparing Exceptional Men &amp; Women for God and Humanity</p>
      <p style="color:#555;font-size:11px">Monrovia, Liberia &nbsp;|&nbsp; hope2academy.org</p>
    </div>
    <div class="text-right col" style="gap:4px">
      <span style="font-size:18px;font-weight:bold;letter-spacing:1px;color:#1a1a1a">${subtitle}</span>
      <span style="font-size:11px;color:#888">Issued: ${today()}</span>
    </div>
  </div>
  <hr class="divider-bold"/>
`;

// ---------------------------------------------------------------------------
// Fee / Tuition Receipt
// ---------------------------------------------------------------------------
function buildFeeReceiptHtml(row: any, issuedBy: string) {
  const no = makeReceiptNo(row.id ?? "x", "RCP");
  const amount = Number(row.amount || 0);
  const lrdRate = getLrdRate();
  const lrdAmount = Math.round(amount * lrdRate);

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${no}</title>
  <style>${PRINT_BASE}</style></head><body>
  <div class="watermark">RECEIPT</div>
  ${SCHOOL_HEADER("OFFICIAL RECEIPT")}
  <div class="flex space-between mt-4">
    <div class="col" style="gap:6px">
      <div><span class="label">Receipt No.</span><br/><strong>${no}</strong></div>
      <div><span class="label">Bill To</span><br/><strong>${row.student ?? "—"}</strong></div>
    </div>
    <div class="col text-right" style="gap:6px">
      <div><span class="label">Due Date</span><br/>${row.due ?? "—"}</div>
      <div><span class="label">Status</span><br/>
        <span class="badge" style="${statusClass(row.status)}">${String(row.status ?? "—").toUpperCase()}</span>
      </div>
    </div>
  </div>
  <table style="margin-top:24px">
    <thead><tr><th>#</th><th>Description</th><th>Amount (USD)</th><th>Amount (LRD)</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>${row.item ?? "—"}</td><td>${fmtUSD(amount)}</td><td>LRD ${lrdAmount.toLocaleString()}</td></tr>
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="2"><strong>TOTAL</strong></td>
        <td><strong>${fmtUSD(amount)}</strong></td>
        <td><strong>LRD ${lrdAmount.toLocaleString()}</strong></td>
      </tr>
    </tfoot>
  </table>
  <p style="font-size:11px;color:#777;margin-top:8px">Exchange rate: 1 USD = ${lrdRate} LRD (for reference only).</p>
  <div style="margin-top:40px;border-top:1px solid #d1d5db;padding-top:16px;display:flex;justify-content:space-between;font-size:11px;color:#888">
    <div>Authorised by: <strong style="color:#1a1a1a">${issuedBy}</strong></div>
    <div>HOPE2 ACADEMY — Finance Office</div>
  </div>
  <script>window.onload=()=>{window.print();}</script>
  </body></html>`;
}

// ---------------------------------------------------------------------------
// Expense / Payment Voucher
// ---------------------------------------------------------------------------
function buildExpenseVoucherHtml(row: any, issuedBy: string) {
  const no = makeReceiptNo(row.id ?? "x", "PV");
  const amount = Number(row.amountUsd || row.amount || 0);
  const lrdRate = getLrdRate();
  const lrdAmount = Math.round(amount * lrdRate);

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Voucher ${no}</title>
  <style>${PRINT_BASE}</style></head><body>
  <div class="watermark">VOUCHER</div>
  ${SCHOOL_HEADER("PAYMENT VOUCHER")}
  <div class="flex space-between mt-4">
    <div class="col" style="gap:6px">
      <div><span class="label">Voucher No.</span><br/><strong>${no}</strong></div>
      <div><span class="label">Payee / Vendor</span><br/><strong>${row.vendor ?? "—"}</strong></div>
    </div>
    <div class="col text-right" style="gap:6px">
      <div><span class="label">Date</span><br/>${row.date ?? "—"}</div>
      <div><span class="label">Status</span><br/>
        <span class="badge" style="${statusClass(row.status)}">${String(row.status ?? "—").toUpperCase()}</span>
      </div>
    </div>
  </div>
  <table style="margin-top:24px">
    <thead><tr><th>#</th><th>Expense</th><th>Category</th><th>Amount (USD)</th><th>Amount (LRD)</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>${row.item ?? "—"}</td><td>${row.category ?? "—"}</td><td>${fmtUSD(amount)}</td><td>LRD ${lrdAmount.toLocaleString()}</td></tr>
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="3"><strong>TOTAL</strong></td>
        <td><strong>${fmtUSD(amount)}</strong></td>
        <td><strong>LRD ${lrdAmount.toLocaleString()}</strong></td>
      </tr>
    </tfoot>
  </table>
  <p style="font-size:11px;color:#777;margin-top:8px">Exchange rate: 1 USD = ${lrdRate} LRD (for reference only).</p>
  <div style="margin-top:40px;border-top:1px solid #d1d5db;padding-top:16px;display:flex;justify-content:space-between;font-size:11px;color:#888">
    <div>Authorised by: <strong style="color:#1a1a1a">${issuedBy}</strong></div>
    <div>HOPE2 ACADEMY — Finance Office</div>
  </div>
  <script>window.onload=()=>{window.print();}</script>
  </body></html>`;
}

// ---------------------------------------------------------------------------
// Payslip
// ---------------------------------------------------------------------------
function buildPayslipHtml(row: any, issuedBy: string) {
  const no = makeReceiptNo(row.id ?? "x", "PAY");
  const salary = Number(row.salaryUsd || 0);
  const allowance = Number(row.allowanceUsd || 0);
  const total = salary + allowance;
  const lrdRate = getLrdRate();

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Payslip ${no}</title>
  <style>${PRINT_BASE}</style></head><body>
  <div class="watermark">PAYSLIP</div>
  ${SCHOOL_HEADER("SALARY PAYSLIP")}
  <div class="flex space-between mt-4">
    <div class="col" style="gap:6px">
      <div><span class="label">Payslip No.</span><br/><strong>${no}</strong></div>
      <div><span class="label">Staff Member</span><br/><strong>${row.staff ?? "—"}</strong></div>
      <div><span class="label">Position</span><br/>${row.role ?? "—"}</div>
    </div>
    <div class="col text-right" style="gap:6px">
      <div><span class="label">Department</span><br/>${row.department ?? "—"}</div>
      <div><span class="label">Pay Period</span><br/><strong>${row.period ?? "—"}</strong></div>
      <div><span class="label">Status</span><br/>
        <span class="badge" style="${statusClass(row.status)}">${String(row.status ?? "—").toUpperCase()}</span>
      </div>
    </div>
  </div>
  <table style="margin-top:24px">
    <thead><tr><th>Earnings</th><th class="text-right">USD</th><th class="text-right">LRD</th></tr></thead>
    <tbody>
      <tr><td>Basic Salary</td><td class="text-right">${fmtUSD(salary)}</td><td class="text-right">LRD ${Math.round(salary*lrdRate).toLocaleString()}</td></tr>
      <tr><td>Allowances</td><td class="text-right">${fmtUSD(allowance)}</td><td class="text-right">LRD ${Math.round(allowance*lrdRate).toLocaleString()}</td></tr>
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td><strong>GROSS PAY</strong></td>
        <td class="text-right"><strong>${fmtUSD(total)}</strong></td>
        <td class="text-right"><strong>LRD ${Math.round(total*lrdRate).toLocaleString()}</strong></td>
      </tr>
    </tfoot>
  </table>
  <p style="font-size:11px;color:#777;margin-top:8px">Exchange rate: 1 USD = ${lrdRate} LRD (for reference only).</p>
  <div style="margin-top:40px;border-top:1px solid #d1d5db;padding-top:16px;display:flex;justify-content:space-between;font-size:11px;color:#888">
    <div>Authorised by: <strong style="color:#1a1a1a">${issuedBy}</strong></div>
    <div>HOPE2 ACADEMY — Finance Office</div>
  </div>
  <script>window.onload=()=>{window.print();}</script>
  </body></html>`;
}

// ---------------------------------------------------------------------------
// Donation Receipt
// ---------------------------------------------------------------------------
function buildDonationReceiptHtml(row: any, issuedBy: string) {
  const no = makeReceiptNo(row.id ?? "x", "DON");
  const amount = Number(row.amountUsd || row.amount || 0);
  const lrdRate = getLrdRate();

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Donation Receipt ${no}</title>
  <style>${PRINT_BASE}</style></head><body>
  <div class="watermark">RECEIPT</div>
  ${SCHOOL_HEADER("DONATION RECEIPT")}
  <div class="flex space-between mt-4">
    <div class="col" style="gap:6px">
      <div><span class="label">Receipt No.</span><br/><strong>${no}</strong></div>
      <div><span class="label">Donor</span><br/><strong>${row.donor ?? "—"}</strong></div>
    </div>
    <div class="col text-right" style="gap:6px">
      <div><span class="label">Date</span><br/>${row.date ?? "—"}</div>
      <div><span class="label">Fund</span><br/><strong>${row.fund ?? "—"}</strong></div>
    </div>
  </div>
  <table style="margin-top:24px">
    <thead><tr><th>Description</th><th>Fund</th><th class="text-right">Amount (USD)</th><th class="text-right">Amount (LRD)</th></tr></thead>
    <tbody>
      <tr><td>Donation — ${row.fund ?? "General"}</td><td>${row.fund ?? "—"}</td>
          <td class="text-right">${fmtUSD(amount)}</td>
          <td class="text-right">LRD ${Math.round(amount*lrdRate).toLocaleString()}</td></tr>
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="2"><strong>TOTAL</strong></td>
        <td class="text-right"><strong>${fmtUSD(amount)}</strong></td>
        <td class="text-right"><strong>LRD ${Math.round(amount*lrdRate).toLocaleString()}</strong></td>
      </tr>
    </tfoot>
  </table>
  <p style="font-size:12px;color:#555;margin-top:16px;font-style:italic">
    This receipt acknowledges a charitable contribution to HOPE2 ACADEMY. Thank you for your generosity.
  </p>
  <p style="font-size:11px;color:#777;margin-top:6px">Exchange rate: 1 USD = ${lrdRate} LRD (for reference only).</p>
  <div style="margin-top:40px;border-top:1px solid #d1d5db;padding-top:16px;display:flex;justify-content:space-between;font-size:11px;color:#888">
    <div>Authorised by: <strong style="color:#1a1a1a">${issuedBy}</strong></div>
    <div>HOPE2 ACADEMY — Finance Office</div>
  </div>
  <script>window.onload=()=>{window.print();}</script>
  </body></html>`;
}

// ---------------------------------------------------------------------------
// openPrint — opens the HTML in a new window for browser print/save-as-PDF
// ---------------------------------------------------------------------------
export function openPrint(html: string) {
  const w = window.open("", "_blank", "width=900,height=720");
  if (!w) { toast.error("Allow pop-ups to print receipts"); return; }
  w.document.write(html);
  w.document.close();
}

// ---------------------------------------------------------------------------
// Shared receipt modal shell
// ---------------------------------------------------------------------------
type ReceiptModalProps = {
  title: string;
  receiptNo: string;
  onClose: () => void;
  onPrint: () => void;
  children: React.ReactNode;
};

function ReceiptModalShell({ title, receiptNo, onClose, onPrint, children }: ReceiptModalProps) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Preview card */}
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          {/* School letterhead */}
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 px-6 py-5 border-b border-border flex justify-between items-start">
            <div>
              <p className="font-display font-bold text-lg text-foreground">HOPE2 ACADEMY</p>
              <p className="text-xs text-muted-foreground mt-0.5">Preparing Exceptional Men & Women for God and Humanity</p>
              <p className="text-xs text-muted-foreground">Monrovia, Liberia</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-1">{receiptNo}</p>
              <p className="text-xs text-muted-foreground">{today()}</p>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            {children}
          </div>
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button className="gap-2" onClick={onPrint}>
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper to show a detail row inside the preview
function DetailRow({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/60 last:border-0 text-sm">
      <span className="text-muted-foreground text-xs uppercase tracking-wide">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const t = String(status).toLowerCase();
  const cls = t === "paid" || t === "active"
    ? "bg-green-100 text-green-700"
    : t === "outstanding" || t === "pending"
    ? "bg-destructive/10 text-destructive"
    : "bg-muted text-foreground/70";
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${cls}`}>{status}</span>;
}

// ---------------------------------------------------------------------------
// FeeReceiptModal
// ---------------------------------------------------------------------------
export function FeeReceiptModal({ row, issuedBy, onClose }: { row: any; issuedBy: string; onClose: () => void }) {
  const no = makeReceiptNo(row.id ?? "x", "RCP");
  const amount = Number(row.amount || 0);

  return (
    <ReceiptModalShell
      title="Official Receipt"
      receiptNo={no}
      onClose={onClose}
      onPrint={() => openPrint(buildFeeReceiptHtml(row, issuedBy))}
    >
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
        <div className="space-y-0">
          <DetailRow label="Receipt No." value={no} bold />
          <DetailRow label="Student" value={row.student ?? "—"} bold />
          <DetailRow label="Due Date" value={row.due ?? "—"} />
        </div>
        <div className="space-y-0">
          <DetailRow label="Status" value={<StatusPill status={row.status ?? "—"} />} />
          <DetailRow label="Issued By" value={issuedBy} />
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden mt-2">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</th>
              <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">USD</th>
              <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">LRD</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="px-4 py-3">{row.item ?? "—"}</td>
              <td className="px-4 py-3 text-right font-medium">{fmtUSD(amount)}</td>
              <td className="px-4 py-3 text-right text-muted-foreground">{fmtLRD(amount)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/30">
              <td className="px-4 py-2.5 font-bold text-xs uppercase tracking-wide">Total</td>
              <td className="px-4 py-2.5 text-right font-bold">{fmtUSD(amount)}</td>
              <td className="px-4 py-2.5 text-right font-bold text-muted-foreground">{fmtLRD(amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-muted-foreground text-center pt-1">
        Exchange rate: 1 USD = {getLrdRate()} LRD · HOPE2 ACADEMY Finance Office
      </p>
    </ReceiptModalShell>
  );
}

// ---------------------------------------------------------------------------
// ExpenseVoucherModal
// ---------------------------------------------------------------------------
export function ExpenseVoucherModal({ row, issuedBy, onClose }: { row: any; issuedBy: string; onClose: () => void }) {
  const no = makeReceiptNo(row.id ?? "x", "PV");
  const amount = Number(row.amountUsd || row.amount || 0);

  return (
    <ReceiptModalShell
      title="Payment Voucher"
      receiptNo={no}
      onClose={onClose}
      onPrint={() => openPrint(buildExpenseVoucherHtml(row, issuedBy))}
    >
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
        <div className="space-y-0">
          <DetailRow label="Voucher No." value={no} bold />
          <DetailRow label="Payee / Vendor" value={row.vendor ?? "—"} bold />
          <DetailRow label="Date" value={row.date ?? "—"} />
        </div>
        <div className="space-y-0">
          <DetailRow label="Category" value={row.category ?? "—"} />
          <DetailRow label="Status" value={<StatusPill status={row.status ?? "—"} />} />
          <DetailRow label="Authorised By" value={issuedBy} />
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden mt-2">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Expense</th>
              <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</th>
              <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">USD</th>
              <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">LRD</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="px-4 py-3">{row.item ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.category ?? "—"}</td>
              <td className="px-4 py-3 text-right font-medium">{fmtUSD(amount)}</td>
              <td className="px-4 py-3 text-right text-muted-foreground">{fmtLRD(amount)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/30">
              <td colSpan={2} className="px-4 py-2.5 font-bold text-xs uppercase tracking-wide">Total</td>
              <td className="px-4 py-2.5 text-right font-bold">{fmtUSD(amount)}</td>
              <td className="px-4 py-2.5 text-right font-bold text-muted-foreground">{fmtLRD(amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-muted-foreground text-center pt-1">
        Exchange rate: 1 USD = {getLrdRate()} LRD · HOPE2 ACADEMY Finance Office
      </p>
    </ReceiptModalShell>
  );
}

// ---------------------------------------------------------------------------
// PayslipModal
// ---------------------------------------------------------------------------
export function PayslipModal({ row, issuedBy, onClose }: { row: any; issuedBy: string; onClose: () => void }) {
  const no = makeReceiptNo(row.id ?? "x", "PAY");
  const salary = Number(row.salaryUsd || 0);
  const allowance = Number(row.allowanceUsd || 0);
  const total = salary + allowance;

  return (
    <ReceiptModalShell
      title="Salary Payslip"
      receiptNo={no}
      onClose={onClose}
      onPrint={() => openPrint(buildPayslipHtml(row, issuedBy))}
    >
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
        <div className="space-y-0">
          <DetailRow label="Payslip No." value={no} bold />
          <DetailRow label="Staff Member" value={row.staff ?? "—"} bold />
          <DetailRow label="Position" value={row.role ?? "—"} />
        </div>
        <div className="space-y-0">
          <DetailRow label="Department" value={row.department ?? "—"} />
          <DetailRow label="Pay Period" value={row.period ?? "—"} />
          <DetailRow label="Status" value={<StatusPill status={row.status ?? "—"} />} />
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden mt-2">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Earnings</th>
              <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">USD</th>
              <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">LRD</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="px-4 py-3">Basic Salary</td>
              <td className="px-4 py-3 text-right font-medium">{fmtUSD(salary)}</td>
              <td className="px-4 py-3 text-right text-muted-foreground">{fmtLRD(salary)}</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-3">Allowances</td>
              <td className="px-4 py-3 text-right font-medium">{fmtUSD(allowance)}</td>
              <td className="px-4 py-3 text-right text-muted-foreground">{fmtLRD(allowance)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/30">
              <td className="px-4 py-2.5 font-bold text-xs uppercase tracking-wide">Gross Pay</td>
              <td className="px-4 py-2.5 text-right font-bold">{fmtUSD(total)}</td>
              <td className="px-4 py-2.5 text-right font-bold text-muted-foreground">{fmtLRD(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-muted-foreground text-center pt-1">
        Exchange rate: 1 USD = {getLrdRate()} LRD · HOPE2 ACADEMY Finance Office
      </p>
    </ReceiptModalShell>
  );
}

// ---------------------------------------------------------------------------
// DonationReceiptModal
// ---------------------------------------------------------------------------
export function DonationReceiptModal({ row, issuedBy, onClose }: { row: any; issuedBy: string; onClose: () => void }) {
  const no = makeReceiptNo(row.id ?? "x", "DON");
  const amount = Number(row.amountUsd || row.amount || 0);

  return (
    <ReceiptModalShell
      title="Donation Receipt"
      receiptNo={no}
      onClose={onClose}
      onPrint={() => openPrint(buildDonationReceiptHtml(row, issuedBy))}
    >
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
        <div className="space-y-0">
          <DetailRow label="Receipt No." value={no} bold />
          <DetailRow label="Donor" value={row.donor ?? "—"} bold />
          <DetailRow label="Date" value={row.date ?? "—"} />
        </div>
        <div className="space-y-0">
          <DetailRow label="Fund" value={row.fund ?? "—"} />
          <DetailRow label="Issued By" value={issuedBy} />
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden mt-2">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Fund</th>
              <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">USD</th>
              <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">LRD</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="px-4 py-3">Donation — {row.fund ?? "General"}</td>
              <td className="px-4 py-3 text-right font-medium">{fmtUSD(amount)}</td>
              <td className="px-4 py-3 text-right text-muted-foreground">{fmtLRD(amount)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/30">
              <td className="px-4 py-2.5 font-bold text-xs uppercase tracking-wide">Total</td>
              <td className="px-4 py-2.5 text-right font-bold">{fmtUSD(amount)}</td>
              <td className="px-4 py-2.5 text-right font-bold text-muted-foreground">{fmtLRD(amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-muted-foreground text-center pt-1 italic">
        Thank you for your generous contribution to HOPE2 ACADEMY.
      </p>
      <p className="text-xs text-muted-foreground text-center">
        Exchange rate: 1 USD = {getLrdRate()} LRD · HOPE2 ACADEMY Finance Office
      </p>
    </ReceiptModalShell>
  );
}

// ---------------------------------------------------------------------------
// FeesModule — fees table with per-row receipt generation
// ---------------------------------------------------------------------------
type FieldDef = { name: string; label: string; type: string; required?: boolean; options?: string[]; placeholder?: string };

function statusBadge(s: string) {
  const tone = s.toLowerCase();
  const cls =
    tone === "paid" || tone === "active" ? "bg-primary/10 text-primary"
    : tone === "outstanding" ? "bg-destructive/10 text-destructive"
    : "bg-muted text-foreground/70";
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${cls}`}>{s}</span>;
}

function TableShell({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>{head.map(h => <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r, i) => (
              <motion.tr key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }} className="hover:bg-muted/30">
                {r.map((c, j) => <td key={j} className="px-5 py-3.5">{c}</td>)}
              </motion.tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-8 text-center text-muted-foreground">No records yet.</p>}
      </div>
    </div>
  );
}

export function FeesModule() {
  const principal = usePrincipalLocal();
  const [rows, setRows] = useState<any[]>([]);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");

  const locked = principal ? approvalsStore.lockedCollections(principal.id, principal.role) : [];
  const isLocked = locked.includes("fees");
  const writable = !isLocked && ["superadmin", "admin", "registrar", "admin_assistant"].includes(principal?.role ?? "");

  const load = useCallback(async () => {
    try { setRows((await apiClient.list("fees")) as any[]); }
    catch (e) { if (isNetworkError(e)) setRows(mockDb.list<any>("fees")); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = scopeRows("fees", rows, principal).filter(r =>
    !q || ["student","item","status"].some(k => String(r[k] ?? "").toLowerCase().includes(q.toLowerCase()))
  );

  const remove = async (row: any) => {
    if (!writable) { toast.error("You don't have permission to delete this record"); return; }
    if (!confirm("Delete this fee record?")) return;
    try { await apiClient.remove("fees", row.id); }
    catch (e) { if (!isNetworkError(e)) { toast.error("Could not delete"); return; } mockDb.remove("fees", row.id); }
    toast.success("Fee record deleted"); load();
  };

  const handleSave = async (values: Record<string, any>) => {
    const normalized = { ...values, amount: Number(values.amount ?? 0) };
    if (!editing) Object.assign(normalized, stampOwner(normalized, principal));
    try {
      if (editing) await apiClient.update("fees", editing.id, normalized);
      else await apiClient.create("fees", normalized);
    } catch (e) {
      if (!isNetworkError(e)) { toast.error("Could not save"); return; }
      if (editing) mockDb.update<any>("fees", editing.id, normalized as any);
      else mockDb.create<any>("fees", normalized);
    }
    toast.success(`Fee record ${editing ? "updated" : "created"}`);
    setEditing(null); setCreating(false); load();
  };

  const FIELDS: FieldDef[] = [
    { name: "student", label: "Student", type: "text", required: true },
    { name: "item",    label: "Item",    type: "text", required: true, placeholder: "Period tuition, Lab fee…" },
    { name: "amount",  label: "Amount (USD)", type: "number", required: true },
    { name: "due",     label: "Due date",     type: "date",   required: true },
    { name: "status",  label: "Status",  type: "select", options: ["Outstanding","Paid"], required: true },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fee records…" className="pl-9 bg-card" />
        </div>
        {writable ? (
          <Button className="gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New fee record
          </Button>
        ) : (
          <span className="h-9 px-3 grid place-items-center rounded-md border border-border text-xs text-muted-foreground">
            {isLocked ? "Locked — submitted for approval" : "Read-only"}
          </span>
        )}
      </div>

      <TableShell
        head={["Student", "Item", "Amount (USD · LRD)", "Due", "Status", ""]}
        rows={visible.map(r => [
          <span className="font-medium">{r.student ?? "—"}</span>,
          r.item ?? "—",
          `${fmtUSD(r.amount)} · ${fmtLRD(r.amount)}`,
          r.due ?? "—",
          statusBadge(r.status ?? "—"),
          <div className="flex items-center gap-2 justify-end">
            <Button size="sm" variant="outline" className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
              onClick={() => setReceipt(r)}>
              <Receipt className="h-3.5 w-3.5" /> Receipt
            </Button>
            {writable && <>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(r)}>
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(r)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>}
          </div>,
        ])}
      />

      {receipt && (
        <FeeReceiptModal
          row={receipt}
          issuedBy={principal?.name ?? "Finance Office"}
          onClose={() => setReceipt(null)}
        />
      )}

      {(editing || creating) && (
        <FeeEditor
          fields={FIELDS}
          row={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={handleSave}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// ExpensesModule — expenses table with per-row voucher generation
// ---------------------------------------------------------------------------
export function ExpensesModule() {
  const principal = usePrincipalLocal();
  const [rows, setRows] = useState<any[]>([]);
  const [voucher, setVoucher] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");

  const locked = principal ? approvalsStore.lockedCollections(principal.id, principal.role) : [];
  const isLocked = locked.includes("expenses");
  const writable = !isLocked && ["superadmin", "admin", "registrar"].includes(principal?.role ?? "");

  const load = useCallback(async () => {
    try { setRows((await apiClient.list("expenses")) as any[]); }
    catch (e) { if (isNetworkError(e)) setRows(mockDb.list<any>("expenses")); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = scopeRows("expenses", rows, principal).filter(r =>
    !q || ["item","vendor","category","status"].some(k => String(r[k] ?? "").toLowerCase().includes(q.toLowerCase()))
  );

  const remove = async (row: any) => {
    if (!writable) { toast.error("No permission"); return; }
    if (!confirm("Delete this expense?")) return;
    try { await apiClient.remove("expenses", row.id); }
    catch (e) { if (!isNetworkError(e)) { toast.error("Could not delete"); return; } mockDb.remove("expenses", row.id); }
    toast.success("Expense deleted"); load();
  };

  const handleSave = async (values: Record<string, any>) => {
    const normalized = { ...values, amountUsd: Number(values.amountUsd ?? 0) };
    if (!editing) Object.assign(normalized, stampOwner(normalized, principal));
    try {
      if (editing) await apiClient.update("expenses", editing.id, normalized);
      else await apiClient.create("expenses", normalized);
    } catch (e) {
      if (!isNetworkError(e)) { toast.error("Could not save"); return; }
      if (editing) mockDb.update<any>("expenses", editing.id, normalized as any);
      else mockDb.create<any>("expenses", normalized);
    }
    toast.success(`Expense ${editing ? "updated" : "created"}`);
    setEditing(null); setCreating(false); load();
  };

  const FIELDS: FieldDef[] = [
    { name: "item",      label: "Expense",        type: "text",   required: true },
    { name: "category",  label: "Category",        type: "select", options: ["Utilities","Supplies","Maintenance","Transport","Salaries","Events","Other"], required: true },
    { name: "vendor",    label: "Vendor / payee",  type: "text" },
    { name: "amountUsd", label: "Amount (USD)",    type: "number", required: true },
    { name: "date",      label: "Date",             type: "date",   required: true },
    { name: "status",    label: "Status",           type: "select", options: ["Outstanding","Paid"], required: true },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search expenses…" className="pl-9 bg-card" />
        </div>
        {writable ? (
          <Button className="gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Record expense
          </Button>
        ) : (
          <span className="h-9 px-3 grid place-items-center rounded-md border border-border text-xs text-muted-foreground">
            {isLocked ? "Locked" : "Read-only"}
          </span>
        )}
      </div>

      <TableShell
        head={["Expense", "Category", "Vendor", "Amount (USD · LRD)", "Date", "Status", ""]}
        rows={visible.map(r => [
          <span className="font-medium">{r.item ?? "—"}</span>,
          <span className="inline-flex"><span className="px-2 py-0.5 rounded text-[11px] bg-muted">{r.category ?? "—"}</span></span>,
          r.vendor ?? "—",
          `${fmtUSD(r.amountUsd)} · ${fmtLRD(r.amountUsd)}`,
          r.date ?? "—",
          statusBadge(r.status ?? "—"),
          <div className="flex items-center gap-2 justify-end">
            <Button size="sm" variant="outline" className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
              onClick={() => setVoucher(r)}>
              <Receipt className="h-3.5 w-3.5" /> Voucher
            </Button>
            {writable && <>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(r)}>
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(r)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>}
          </div>,
        ])}
      />

      {voucher && (
        <ExpenseVoucherModal
          row={voucher}
          issuedBy={principal?.name ?? "Finance Office"}
          onClose={() => setVoucher(null)}
        />
      )}

      {(editing || creating) && (
        <FeeEditor
          fields={FIELDS}
          row={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={handleSave}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// PayrollModule — payroll table with per-row payslip generation
// ---------------------------------------------------------------------------
export function PayrollModule() {
  const principal = usePrincipalLocal();
  const [rows, setRows] = useState<any[]>([]);
  const [payslip, setPayslip] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");

  const locked = principal ? approvalsStore.lockedCollections(principal.id, principal.role) : [];
  const isLocked = locked.includes("payroll");
  const writable = !isLocked && ["superadmin", "registrar"].includes(principal?.role ?? "");

  const load = useCallback(async () => {
    try { setRows((await apiClient.list("payroll")) as any[]); }
    catch (e) { if (isNetworkError(e)) setRows(mockDb.list<any>("payroll")); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = scopeRows("payroll", rows, principal).filter(r =>
    !q || ["staff","role","department","period"].some(k => String(r[k] ?? "").toLowerCase().includes(q.toLowerCase()))
  );

  const remove = async (row: any) => {
    if (!writable) { toast.error("No permission"); return; }
    if (!confirm("Delete this payroll record?")) return;
    try { await apiClient.remove("payroll", row.id); }
    catch (e) { if (!isNetworkError(e)) { toast.error("Could not delete"); return; } mockDb.remove("payroll", row.id); }
    toast.success("Record deleted"); load();
  };

  const handleSave = async (values: Record<string, any>) => {
    const normalized = { ...values, salaryUsd: Number(values.salaryUsd ?? 0), allowanceUsd: Number(values.allowanceUsd ?? 0) };
    if (!editing) Object.assign(normalized, stampOwner(normalized, principal));
    try {
      if (editing) await apiClient.update("payroll", editing.id, normalized);
      else await apiClient.create("payroll", normalized);
    } catch (e) {
      if (!isNetworkError(e)) { toast.error("Could not save"); return; }
      if (editing) mockDb.update<any>("payroll", editing.id, normalized as any);
      else mockDb.create<any>("payroll", normalized);
    }
    toast.success(`Payroll record ${editing ? "updated" : "created"}`);
    setEditing(null); setCreating(false); load();
  };

  const FIELDS: FieldDef[] = [
    { name: "staff",       label: "Staff member",         type: "text",   required: true },
    { name: "role",        label: "Position",             type: "text",   required: true },
    { name: "department",  label: "Department",           type: "select", options: ["HOPE2 MISSION","HOPE2 ACADEMY","HOPE2 CHURCH","HOPE2 MEDIA"], required: true },
    { name: "salaryUsd",   label: "Monthly salary (USD)", type: "number", required: true },
    { name: "allowanceUsd",label: "Allowances (USD)",     type: "number" },
    { name: "period",      label: "Pay period",           type: "text",   required: true, placeholder: "July 2026" },
    { name: "status",      label: "Status",               type: "select", options: ["Pending","Paid","On Hold"], required: true },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search payroll…" className="pl-9 bg-card" />
        </div>
        {writable ? (
          <Button className="gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Add salary record
          </Button>
        ) : (
          <span className="h-9 px-3 grid place-items-center rounded-md border border-border text-xs text-muted-foreground">
            {isLocked ? "Locked" : "Read-only"}
          </span>
        )}
      </div>

      <TableShell
        head={["Staff", "Position", "Department", "Salary (USD · LRD)", "Allowances", "Period", "Status", ""]}
        rows={visible.map(r => [
          <span className="font-medium">{r.staff ?? "—"}</span>,
          r.role ?? "—",
          r.department ?? "—",
          `${fmtUSD(r.salaryUsd)} · ${fmtLRD(r.salaryUsd)}`,
          fmtUSD(r.allowanceUsd),
          r.period ?? "—",
          statusBadge(r.status ?? "—"),
          <div className="flex items-center gap-2 justify-end">
            <Button size="sm" variant="outline" className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
              onClick={() => setPayslip(r)}>
              <Receipt className="h-3.5 w-3.5" /> Payslip
            </Button>
            {writable && <>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(r)}>
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(r)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>}
          </div>,
        ])}
      />

      {payslip && (
        <PayslipModal
          row={payslip}
          issuedBy={principal?.name ?? "Finance Office"}
          onClose={() => setPayslip(null)}
        />
      )}

      {(editing || creating) && (
        <FeeEditor
          fields={FIELDS}
          row={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={handleSave}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// DonationsModule — donations table with per-row donation receipt
// ---------------------------------------------------------------------------
export function DonationsModule() {
  const principal = usePrincipalLocal();
  const [rows, setRows] = useState<any[]>([]);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");

  const locked = principal ? approvalsStore.lockedCollections(principal.id, principal.role) : [];
  const isLocked = locked.includes("donations");
  const writable = !isLocked && ["superadmin", "admin", "registrar"].includes(principal?.role ?? "");

  const load = useCallback(async () => {
    try { setRows((await apiClient.list("donations")) as any[]); }
    catch (e) { if (isNetworkError(e)) setRows(mockDb.list<any>("donations")); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = scopeRows("donations", rows, principal).filter(r =>
    !q || ["donor","fund"].some(k => String(r[k] ?? "").toLowerCase().includes(q.toLowerCase()))
  );

  const remove = async (row: any) => {
    if (!writable) { toast.error("No permission"); return; }
    if (!confirm("Delete this donation?")) return;
    try { await apiClient.remove("donations", row.id); }
    catch (e) { if (!isNetworkError(e)) { toast.error("Could not delete"); return; } mockDb.remove("donations", row.id); }
    toast.success("Donation deleted"); load();
  };

  const handleSave = async (values: Record<string, any>) => {
    const normalized = { ...values, amount: Number(values.amount ?? 0) };
    if (!editing) Object.assign(normalized, stampOwner(normalized, principal));
    try {
      if (editing) await apiClient.update("donations", editing.id, normalized);
      else await apiClient.create("donations", normalized);
    } catch (e) {
      if (!isNetworkError(e)) { toast.error("Could not save"); return; }
      if (editing) mockDb.update<any>("donations", editing.id, normalized as any);
      else mockDb.create<any>("donations", normalized);
    }
    toast.success(`Donation ${editing ? "updated" : "created"}`);
    setEditing(null); setCreating(false); load();
  };

  const FIELDS: FieldDef[] = [
    { name: "donor",  label: "Donor",        type: "text",   required: true },
    { name: "fund",   label: "Fund",         type: "select", options: ["Scholarship","Capital","Library","General"], required: true },
    { name: "amount", label: "Amount (USD)", type: "number", required: true },
    { name: "date",   label: "Date",         type: "date",   required: true },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search donations…" className="pl-9 bg-card" />
        </div>
        {writable ? (
          <Button className="gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Record donation
          </Button>
        ) : (
          <span className="h-9 px-3 grid place-items-center rounded-md border border-border text-xs text-muted-foreground">
            Read-only
          </span>
        )}
      </div>

      <TableShell
        head={["Donor", "Fund", "Amount (USD · LRD)", "Date", ""]}
        rows={visible.map(r => [
          <span className="font-medium">{r.donor ?? "—"}</span>,
          r.fund ?? "—",
          `${fmtUSD(r.amount)} · ${fmtLRD(r.amount)}`,
          r.date ?? "—",
          <div className="flex items-center gap-2 justify-end">
            <Button size="sm" variant="outline" className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
              onClick={() => setReceipt(r)}>
              <Receipt className="h-3.5 w-3.5" /> Receipt
            </Button>
            {writable && <>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(r)}>
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(r)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>}
          </div>,
        ])}
      />

      {receipt && (
        <DonationReceiptModal
          row={receipt}
          issuedBy={principal?.name ?? "Finance Office"}
          onClose={() => setReceipt(null)}
        />
      )}

      {(editing || creating) && (
        <FeeEditor
          fields={FIELDS}
          row={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={handleSave}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared inline editor (mirrors SimpleEditor from portal.m.$key.tsx)
// ---------------------------------------------------------------------------
function FeeEditor({
  fields, row, onClose, onSave,
}: {
  fields: FieldDef[];
  row: any | null;
  onClose: () => void;
  onSave: (v: Record<string, any>) => Promise<void>;
}) {
  const [form, setForm] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    for (const f of fields) init[f.name] = row?.[f.name] ?? "";
    return init;
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    for (const f of fields) {
      if (f.required && !form[f.name] && form[f.name] !== 0) {
        toast.error(`${f.label} is required`); return;
      }
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row ? "Edit record" : "New record"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {fields.map(f => (
            <div key={f.name} className="space-y-1.5">
              <label className="text-sm font-medium">{f.label}{f.required && <span className="text-destructive ml-0.5">*</span>}</label>
              {f.type === "select" ? (
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form[f.name] ?? ""}
                  onChange={e => set(f.name, e.target.value)}
                >
                  <option value="">Select…</option>
                  {(f.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form[f.name] ?? ""}
                  onChange={e => set(f.name, e.target.value)}
                  placeholder={f.placeholder}
                />
              ) : (
                <Input
                  type={f.type}
                  value={form[f.name] ?? ""}
                  onChange={e => set(f.name, e.target.value)}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : row ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
