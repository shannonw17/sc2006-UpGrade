export default function Maps() {
  const apiKey = "AIzaSyCUQiQ8Ku1c06N3e3CYVRdKKozErIydD9w";

  return (
    <div
      style={{
        width: "2000px", // frame width
        height: "1000px", // frame height
        border: "2px solid #000", // optional border
        borderRadius: "8px", // optional rounded corners
        overflow: "hidden", // ensures map fits nicely
        margin: "100px auto", // center on page
      }}
    >
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=Singapore`}
      ></iframe>
    </div>
  );
}

