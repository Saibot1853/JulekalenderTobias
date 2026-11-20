document.querySelectorAll('.buttonrutte').forEach(knapp => {
  knapp.addEventListener('click', () => {
    knapp.querySelector('.tall').classList.add('skjult');
    knapp.querySelector('.bakl').classList.remove('skjult');
  });
});