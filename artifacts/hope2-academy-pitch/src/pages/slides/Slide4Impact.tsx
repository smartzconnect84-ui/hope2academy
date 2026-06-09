export default function Slide4Impact() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#F8F4EC" }}>
      <div className="absolute left-0 top-0 bottom-0" style={{ width: "0.5vw", background: "#1B4332" }} />

      <div className="absolute inset-0 flex flex-col justify-center px-[8vw]">
        <span style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.4vw", fontWeight: 600, color: "#D4A040", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "2vh" }}>
          Impact at a Glance
        </span>
        <h2 style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "3.8vw", fontWeight: 700, color: "#1B4332", lineHeight: 1.15, marginBottom: "6vh", textWrap: "balance" }}>
          Real numbers. Real community.
        </h2>

        <div className="flex" style={{ gap: "5vw" }}>
          <div className="flex flex-col" style={{ flex: 1 }}>
            <p style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "10vw", fontWeight: 900, color: "#1B4332", lineHeight: 1, letterSpacing: "-0.03em" }}>286</p>
            <div style={{ width: "4vw", height: "0.4vh", background: "#D4A040", margin: "1.5vh 0" }} />
            <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "2vw", fontWeight: 600, color: "#2D2D2D" }}>Students enrolled</p>
            <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.7vw", color: "#6B7C6B", marginTop: "0.8vh" }}>across 16 grade levels</p>
          </div>
          <div className="flex flex-col" style={{ flex: 1 }}>
            <p style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "10vw", fontWeight: 900, color: "#1B4332", lineHeight: 1, letterSpacing: "-0.03em" }}>34</p>
            <div style={{ width: "4vw", height: "0.4vh", background: "#D4A040", margin: "1.5vh 0" }} />
            <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "2vw", fontWeight: 600, color: "#2D2D2D" }}>Staff managed</p>
            <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.7vw", color: "#6B7C6B", marginTop: "0.8vh" }}>across 4 HOPE2 divisions</p>
          </div>
          <div className="flex flex-col" style={{ flex: 1 }}>
            <p style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "10vw", fontWeight: 900, color: "#D4A040", lineHeight: 1, letterSpacing: "-0.03em" }}>100%</p>
            <div style={{ width: "4vw", height: "0.4vh", background: "#1B4332", margin: "1.5vh 0" }} />
            <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "2vw", fontWeight: 600, color: "#2D2D2D" }}>Admin off paper</p>
            <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.7vw", color: "#6B7C6B", marginTop: "0.8vh" }}>fee collection simplified</p>
          </div>
        </div>
      </div>
    </div>
  );
}
