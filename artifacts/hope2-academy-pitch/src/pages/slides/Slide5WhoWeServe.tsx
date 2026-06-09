export default function Slide5WhoWeServe() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#F8F4EC" }}>
      <div className="absolute left-0 top-0 bottom-0" style={{ width: "0.5vw", background: "#D4A040" }} />
      <div className="absolute bottom-0 right-0" style={{ width: "45vw", height: "50vh", background: "#1B4332", opacity: 0.05, borderRadius: "50% 0 0 0" }} />

      <div className="absolute inset-0 flex px-[8vw] py-[7vh]">
        <div className="flex flex-col justify-between" style={{ flex: 1 }}>
          <div>
            <span style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.4vw", fontWeight: 600, color: "#D4A040", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: "2vh" }}>
              Who We Serve
            </span>
            <h2 style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "4vw", fontWeight: 700, color: "#1B4332", lineHeight: 1.15, maxWidth: "48vw", textWrap: "balance", marginBottom: "5vh" }}>
              A whole community, not just a school.
            </h2>
          </div>

          <div className="flex flex-col" style={{ gap: "2.5vh" }}>
            <div className="flex items-center gap-[2vw]">
              <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "50%", background: "#1B4332", flexShrink: 0 }} />
              <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "2vw", color: "#2D2D2D", fontWeight: 600 }}>
                HOPE2 ACADEMY · HOPE2 MISSION · HOPE2 CHURCH · HOPE2 MEDIA
              </p>
            </div>
            <div className="flex items-center gap-[2vw]">
              <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "50%", background: "#D4A040", flexShrink: 0 }} />
              <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "2vw", color: "#2D2D2D" }}>
                Students &amp; parents across <span style={{ fontWeight: 600 }}>Margibi County and beyond</span>
              </p>
            </div>
            <div className="flex items-center gap-[2vw]">
              <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "50%", background: "#4A7C59", flexShrink: 0 }} />
              <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "2vw", color: "#2D2D2D" }}>
                Teachers, alumni, and admin staff — <span style={{ fontWeight: 600 }}>six distinct roles</span>
              </p>
            </div>
          </div>

          <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.6vw", color: "#6B7C6B", fontStyle: "italic" }}>
            Built to scale across Liberian schools.
          </p>
        </div>

        <div className="flex flex-col justify-center" style={{ paddingLeft: "5vw", borderLeft: "0.15vw solid rgba(27,67,50,0.15)" }}>
          <div className="flex flex-col" style={{ gap: "3.5vh" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "5.5vw", fontWeight: 900, color: "#1B4332", lineHeight: 1 }}>4</p>
              <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.7vw", color: "#6B7C6B", marginTop: "0.5vh" }}>Divisions</p>
            </div>
            <div style={{ width: "100%", height: "0.2vh", background: "rgba(27,67,50,0.12)" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "5.5vw", fontWeight: 900, color: "#D4A040", lineHeight: 1 }}>6</p>
              <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.7vw", color: "#6B7C6B", marginTop: "0.5vh" }}>Role Portals</p>
            </div>
            <div style={{ width: "100%", height: "0.2vh", background: "rgba(27,67,50,0.12)" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "5.5vw", fontWeight: 900, color: "#1B4332", lineHeight: 1 }}>2</p>
              <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.7vw", color: "#6B7C6B", marginTop: "0.5vh" }}>Platforms</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
