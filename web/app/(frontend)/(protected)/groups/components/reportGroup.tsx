//Each button in the modal should call your API route like:
await fetch("/api/approveReport", {
    method: "POST",
    body: JSON.stringify({ reportId, action: "warn" }), //or "ban"
  });

//js ask chat for help, dumping this here just in case yall need it for reference