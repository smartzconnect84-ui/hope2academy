const base = import.meta.env.BASE_URL;

export default function Slide1Title() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1B4332" }}>
      <img
        src={`${base}hero-campus.png`}
        crossOrigin="anonymous"
        alt="HOPE2 Academy campus"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.22 }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(27,67,50,0.95) 0%, rgba(27,67,50,0.75) 100%)" }} />

      <div className="absolute inset-0 flex flex-col justify-between px-[8vw] py-[7vh]">
        <div className="flex items-center gap-[1.5vw]">
          <div style={{ width: "0.5vw", height: "4vh", background: "#D4A040", borderRadius: "2px" }} />
          <span style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.6vw", fontWeight: 600, color: "#D4A040", letterSpacing: "0.18em", textTransform: "uppercase" }}>
            Marshall Road Campus · Margibi County, Liberia
          </span>
        </div>

        <div>
          <div style={{ width: "6vw", height: "0.5vh", background: "#D4A040", marginBottom: "3vh" }} />
          <h1 style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "9vw", fontWeight: 900, color: "#F8F4EC", lineHeight: 1, letterSpacing: "-0.02em", textWrap: "balance" }}>
            HOPE2
          </h1>
          <h1 style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "9vw", fontWeight: 900, color: "#D4A040", lineHeight: 1, letterSpacing: "-0.02em" }}>
            ACADEMY
          </h1>
          <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "2.2vw", fontWeight: 400, color: "rgba(248,244,236,0.82)", marginTop: "3.5vh", maxWidth: "55vw", lineHeight: 1.5, textWrap: "pretty" }}>
            A modern school management platform built for Liberia — web portal, mobile app, and multi-role access for every stakeholder.
          </p>
        </div>

        <div style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.5vw", color: "rgba(248,244,236,0.45)", letterSpacing: "0.06em" }}>
          Web · Mobile · Multi-Role
        </div>
      </div>

      <div className="absolute right-0 top-0 bottom-0" style={{ width: "0.4vw", background: "linear-gradient(to bottom, transparent, #D4A040 30%, #D4A040 70%, transparent)" }} />
    </div>
  );
}
