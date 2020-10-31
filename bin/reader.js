export default () => {
  const inputField = document.querySelector('#inputField');
  const addChannelButton = document.querySelector('#addChannelButton');
  addChannelButton.addEventListener('click', () => {
    console.log(inputField.value);
  });
};