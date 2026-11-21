const dataTag = document.getElementById("kalenderdata");
const kalenderluker = document.getElementById("kalenderluker");
const popup = document.getElementById("popup");
const popupinnhold = document.getElementById("popupinnhold");
const lukk = document.getElementById("lukk");
const kalenderinfo = document.getElementById("kalenderinfo");

if (dataTag && kalenderluker && popup && popupinnhold && lukk) {
  const data = JSON.parse(dataTag.textContent);

  if (data.participantName) {
    const innlogget = document.createElement("p");
    innlogget.textContent = "Logget inn som " + data.participantName;
    kalenderinfo.appendChild(innlogget);
  }

  if (data.submitted) {
    const melding = document.createElement("p");
    melding.setAttribute("role", "status");
    melding.textContent = "Svaret er sendt inn.";
    kalenderinfo.appendChild(melding);
  }

  for (let id = 1; id <= 24; id++) {
    const sporsmal = data.questions.find(question => question.id === id);
    const li = document.createElement("li");
    const knapp = document.createElement("button");
    const skall = document.createElement("span");

    knapp.className = "buttonrutte";
    knapp.type = "button";
    knapp.disabled = !sporsmal;

    if (!sporsmal) {
      knapp.style.filter = "grayscale(1)";
      knapp.style.opacity = "0.5";
      knapp.style.cursor = "not-allowed";
    }
    skall.className = "skall";
    skall.textContent = id;

    knapp.appendChild(skall);
    li.appendChild(knapp);
    kalenderluker.appendChild(li);

    if (sporsmal) {
      knapp.addEventListener("click", () => visSporsmal(sporsmal, data.participantName));
    }
  }

  lukk.addEventListener("click", () => popup.close());
}

function visSporsmal(sporsmal, participantName) {
  popupinnhold.replaceChildren();

  const overskrift = document.createElement("h2");
  overskrift.textContent = sporsmal.question;
  popupinnhold.appendChild(overskrift);

  if (sporsmal.video_url) {
    const videoLenke = document.createElement("a");
    videoLenke.href = sporsmal.video_url;
    videoLenke.target = "_blank";
    videoLenke.rel = "noopener noreferrer";
    videoLenke.textContent = "Åpne video";
    popupinnhold.appendChild(videoLenke);
  }

  if (!participantName) {
    const loginLenke = document.createElement("a");
    loginLenke.href = "/login";
    loginLenke.textContent = "Logg inn for å svare";
    popupinnhold.appendChild(loginLenke);
  } else {
    const form = document.createElement("form");
    form.action = "/answers";
    form.method = "POST";

    const questionId = document.createElement("input");
    questionId.type = "hidden";
    questionId.name = "questionId";
    questionId.value = sporsmal.id;
    form.appendChild(questionId);

    if (sporsmal.options.length > 0) {
      const instruksjon = document.createElement("p");
      instruksjon.textContent = "Velg et svar:";
      form.appendChild(instruksjon);

      sporsmal.options.forEach(alternativ => {
        const label = document.createElement("label");
        const valg = document.createElement("input");
        valg.type = "radio";
        valg.name = "answer";
        valg.value = alternativ;
        valg.required = true;
        label.appendChild(valg);
        label.appendChild(document.createTextNode(" " + alternativ));
        form.appendChild(label);
      });
    } else {
      const label = document.createElement("label");
      label.textContent = "Skriv svaret ditt: ";
      const svarfelt = document.createElement("input");
      svarfelt.type = "text";
      svarfelt.name = "answer";
      svarfelt.required = true;
      label.appendChild(svarfelt);
      form.appendChild(label);
    }

    const sendKnapp = document.createElement("button");
    sendKnapp.type = "submit";
    sendKnapp.textContent = "Send svar";
    form.appendChild(sendKnapp);
    popupinnhold.appendChild(form);
  }

  popup.showModal();
}