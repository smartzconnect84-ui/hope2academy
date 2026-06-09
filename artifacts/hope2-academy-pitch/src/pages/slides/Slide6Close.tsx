const base = import.meta.env.BASE_URL;

export default function Slide6Close() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1B4332" }}>
      <img
        src={`${base}hero-campus.png`}
        crossOrigin="anonymous"
        alt="HOPE2 Academy campus"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.15 }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(27,67,50,0.97) 40%, rgba(27,67,50,0.85) 100%)" }} />

      <div className="absolute top-0 left-0 right-0" style={{ height: "0.5vh", background: "#D4A040" }} />

      <div className="absolute inset-0 flex flex-col justify-center items-center px-[8vw] text-center">
        <span style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.4vw", fontWeight: 600, color: "#D4A040", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "3vh" }}>
          Partner With Us
        </span>

        <h2 style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "5.5vw", fontWeight: 900, color: "#F8F4EC", lineHeight: 1.1, letterSpacing: "-0.02em", maxWidth: "72vw", textWrap: "balance", marginBottom: "2.5vh" }}>
          Built for Liberia.<br />Ready to scale.
        </h2>

        <div style={{ width: "8vw", height: "0.4vh", background: "#D4A040", marginBottom: "4vh" }} />

        <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "2vw", color: "rgba(248,244,236,0.78)", lineHeight: 1.55, maxWidth: "58vw", textWrap: "pretty", marginBottom: "5vh" }}>
          Open to partnerships with funders, NGOs, and education ministries. Let's bring digital school management to every Liberian school.
        </p>

        <div className="flex items-center" style={{ gap: "4vw" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.9vw", fontWeight: 600, color: "#D4A040" }}>info@hope2academy.org</p>
            <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.5vw", color: "rgba(248,244,236,0.55)", marginTop: "0.5vh" }}>Email</p>
          </div>
          <div style={{ width: "0.15vw", height: "5vh", background: "rgba(212,160,64,0.35)" }} />
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.9vw", fontWeight: 600, color: "#F8F4EC" }}>Marshall Road Campus</p>
            <p style={{ fontFamily: "Source Sans 3, system-ui, sans-serif", fontSize: "1.5vw", color: "rgba(248,244,236,0.55)", marginTop: "0.5vh" }}>Lower Margibi County, Liberia</p>
          </div>
        </div>
      </div>

      <div className="absolute right-0 top-0 bottom-0" style={{ width: "0.4vw", background: "linear-gradient(to bottom, transparent, #D4A040 30%, #D4A040 70%, transparent)" }} />
    </div>
  );
}
