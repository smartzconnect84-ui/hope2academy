export default function Slide2Problem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#F8F4EC" }}>
      <div className="absolute left-0 top-0 bottom-0" style={{ width: "0.5vw", background: "#1B4332" }} />
      <div className="absolute top-0 right-0" style={{ width: "38vw", height: "100vh", background: "#1B4332", opacity: 0.06 }} />

      <div className="absolute inset-0 flex flex-col justify-center pl-[8vw] pr-[8vw]">
        <span style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.4vw", fontWeight: 600, color: "#D4A040", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "2vh" }}>
          The Problem
        </span>
        <h2 style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "4.8vw", fontWeight: 700, color: "#1B4332", lineHeight: 1.15, letterSpacing: "-0.01em", maxWidth: "60vw", textWrap: "balance", marginBottom: "5vh" }}>
          Liberian schools still run on paper.
        </h2>

        <div className="flex flex-col" style={{ gap: "3vh", maxWidth: "62vw" }}>
          <div className="flex items-start gap-[2vw]">
            <div style={{ minWidth: "0.4vw", height: "4.5vh", background: "#D4A040", marginTop: "0.4vh", borderRadius: "2px" }} />
            <div>
              <p style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "2.1vw", fontWeight: 700, color: "#2D2D2D", marginBottom: "0.5vh" }}>Attendance tracked on paper</p>
              <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.8vw", color: "#6B7C6B", lineHeight: 1.4 }}>Records get lost or falsified — no accountability trail</p>
            </div>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div style={{ minWidth: "0.4vw", height: "4.5vh", background: "#D4A040", marginTop: "0.4vh", borderRadius: "2px" }} />
            <div>
              <p style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "2.1vw", fontWeight: 700, color: "#2D2D2D", marginBottom: "0.5vh" }}>Parents have no visibility</p>
              <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.8vw", color: "#6B7C6B", lineHeight: 1.4 }}>No way to check grades, fees, or attendance without visiting school</p>
            </div>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div style={{ minWidth: "0.4vw", height: "4.5vh", background: "#D4A040", marginTop: "0.4vh", borderRadius: "2px" }} />
            <div>
              <p style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "2.1vw", fontWeight: 700, color: "#2D2D2D", marginBottom: "0.5vh" }}>Alumni disappear after graduation</p>
              <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.8vw", color: "#6B7C6B", lineHeight: 1.4 }}>No network, no giving-back channel, no community continuity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
