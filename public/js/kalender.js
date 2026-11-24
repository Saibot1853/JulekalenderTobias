const popup = document.getElementById("popup");
const lukk = document.getElementById("lukk");

 document.querySelectorAll("[data-luke]").forEach(knapp => {
  knapp.addEventListener("click", () => {
    document.querySelectorAll("#popupinnhold > div").forEach(sporsmal => {
      sporsmal.hidden = true;
    });

    document.getElementById("sporsmal-" + knapp.dataset.luke).hidden = false;
    popup.showModal();
  });
});

lukk.addEventListener("click", () => popup.close());