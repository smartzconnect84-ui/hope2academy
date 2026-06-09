export default function Slide3Platform() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1B4332" }}>
      <div className="absolute top-0 left-0 right-0" style={{ height: "0.5vh", background: "#D4A040" }} />

      <div className="absolute inset-0 flex flex-col px-[8vw] py-[7vh]">
        <span style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.4vw", fontWeight: 600, color: "#D4A040", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "2vh" }}>
          The Platform
        </span>
        <h2 style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "4.2vw", fontWeight: 700, color: "#F8F4EC", lineHeight: 1.15, marginBottom: "6vh", maxWidth: "70vw", textWrap: "balance" }}>
          One platform. Every stakeholder. All in one place.
        </h2>

        <div className="flex" style={{ gap: "3vw", flex: 1 }}>
          <div className="flex flex-col" style={{ flex: 1, background: "rgba(248,244,236,0.07)", borderRadius: "1vw", padding: "3vh 2.5vw", borderTop: "0.4vh solid #D4A040" }}>
            <p style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "2.2vw", fontWeight: 700, color: "#D4A040", marginBottom: "1.5vh" }}>Six Portals</p>
            <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.8vw", color: "rgba(248,244,236,0.80)", lineHeight: 1.55 }}>
              Superadmin · Admin · Teacher · Student · Parent · Alumni — each role sees only what they need
            </p>
          </div>
          <div className="flex flex-col" style={{ flex: 1, background: "rgba(248,244,236,0.07)", borderRadius: "1vw", padding: "3vh 2.5vw", borderTop: "0.4vh solid #D4A040" }}>
            <p style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "2.2vw", fontWeight: 700, color: "#D4A040", marginBottom: "1.5vh" }}>Full Lifecycle</p>
            <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.8vw", color: "rgba(248,244,236,0.80)", lineHeight: 1.55 }}>
              Announcements · Grades · Attendance · Timetables · Fees · Library — one source of truth
            </p>
          </div>
          <div className="flex flex-col" style={{ flex: 1, background: "rgba(248,244,236,0.07)", borderRadius: "1vw", padding: "3vh 2.5vw", borderTop: "0.4vh solid #D4A040" }}>
            <p style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "2.2vw", fontWeight: 700, color: "#D4A040", marginBottom: "1.5vh" }}>Web + Mobile</p>
            <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.8vw", color: "rgba(248,244,236,0.80)", lineHeight: 1.55 }}>
              Full browser portal and a native iOS/Android app — push notifications, offline-ready, low-bandwidth
            </p>
          </div>
        </div>
      </div>

      <div className="absolute right-0 bottom-0" style={{ width: "0.4vw", height: "40vh", background: "linear-gradient(to bottom, transparent, rgba(212,160,64,0.4))" }} />
    </div>
  );
}
