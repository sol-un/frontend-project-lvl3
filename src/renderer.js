/* eslint-disable no-param-reassign */

import onChange from 'on-change';
import i18next from 'i18next';
import { formatDate, t } from './utils.js';

const renderStrings = (nodes) => {
  const {
    header, pitch, addButton, suggestedLink,
  } = nodes;

  header.textContent = t('header');
  pitch.innerHTML = t('pitch', { linkText: 'RSS', addButtonText: '$t(addButton)' });
  addButton.textContent = t('addButton');
  suggestedLink.innerHTML = t('suggestedLinks', { link1: '$t(link1)', link2: '$t(link2)' });
};

const renderModalContents = (modalNodes, { title, description }) => {
  const { modalTitle, modalBody } = modalNodes;
  modalTitle.textContent = title;
  modalBody.innerHTML = description;
};

const renderSuccessMessage = (container) => {
  container.innerHTML = `
  <div class="alert alert-info fade show">
  ${t('loadingSuccess')}
  </div>
  `;
};

const renderErrorMessage = (container, error) => {
  container.innerHTML = `
  <div class="alert alert-danger fade show">
  ${t(`errors.${error}`)}
  </div>
  `;
};

const renderFeeds = (container, state) => {
  const { channels, posts } = state;

  container.innerHTML = '';

  if (channels.length === 0) {
    container.innerHTML = `<div class="mt-4 text-center"><i>${t('noChannels')}</i></div>`;
    return;
  }

  const channelsContainer = document.createElement('div');
  const channelCards = channels.map(({ title, description }) => `
    <div class="card">
      <div class="card-body">
        <h3 class="card-title">${title}</h3>
        <p class="card-text">${description}</p>
      </div>
    </div>
  `);
  channelsContainer.innerHTML = `<h2 class="mt-4">Channels</h2>${channelCards.join('')}`;
  container.append(channelsContainer);

  const postsContainer = document.createElement('div');
  const postCards = posts.map(({
    id, title, link, creator, pubDate,
  }) => {
    const fontWeightValue = state.uiState.viewedPosts.includes(id)
      ? 'normal'
      : 'bold';
    const creatorSubtitle = creator
      ? `<h6 class="card-subtitle text-muted">${t('creator')} ${creator}</h6>`
      : null;
    const dateInfo = pubDate
      ? `<p class="card-text"><i class="card-text">${t('pubDate', formatDate(pubDate))}</i></p>`
      : null;
    return `
      <div class="card">
        <div class="card-body">
          <a
            class="font-weight-${fontWeightValue}"
            href="${link}"
            target="blank"
          >
            <h5
              class="card-title
              font-weight-${fontWeightValue}">${title}
            </h5>
          </a>
          ${creatorSubtitle || null}
          <button
            class="btn btn-primary my-3"
            type="button"
            role="button"
            aria-label="preview"
            data-id="${id}"
          >
            ${t('synopsis')}
          </button>
          ${dateInfo || null}
        </div>
      </div>
    `;
  });
  postsContainer.innerHTML = `<h2 class="mt-5">Posts</h2>${postCards.join('')}`;
  container.append(postsContainer);
};

const disableForm = ({ input, button }) => {
  input.setAttribute('readonly', 'readonly');
  button.setAttribute('disabled', '');
};
const enableForm = ({ input, button }) => {
  input.removeAttribute('readonly');
  button.removeAttribute('disabled');
};

export default (state, nodeDispatcher) => {
  const {
    flashContainer,
    i18n,
    modal,
    input,
    container,
  } = nodeDispatcher;
  const watchedState = onChange(state, (path, value) => {
    const {
      form,
      loadingProcess,
      uiState,
      modalContents,
    } = state;
    switch (path) {
      case 'form.status':
        switch (value) {
          case 'active':
            enableForm(nodeDispatcher);
            break;
          case 'disabled':
            disableForm(nodeDispatcher);
            break;
          default:
            throw new Error(`Unknown property for state.form.status: '${value}'`);
        }
        break;
      case 'form.error':
        renderErrorMessage(flashContainer, form.error);
        break;
      case 'loadingProcess.error':
        renderErrorMessage(flashContainer, loadingProcess.error);
        break;
      case 'uiState.locale':
        i18next.changeLanguage(uiState.locale);
        renderStrings(i18n);
        break;
      case 'channels':
      case 'addedLinks':
      case 'posts':
      case 'uiState.viewedPosts':
        renderFeeds(container, state);
        break;
      case 'loadingProcess.status':
        switch (value) {
          case 'success':
            input.value = '';
            renderSuccessMessage(flashContainer);
            enableForm(nodeDispatcher);
            break;
          case 'error':
            renderErrorMessage(flashContainer, loadingProcess.error);
            enableForm(nodeDispatcher);
            break;
          case 'fetching':
            disableForm(nodeDispatcher);
            break;
          case 'idle':
            flashContainer.innerHTML = '';
            enableForm(nodeDispatcher);
            break;
          default:
            throw new Error(`Unknown property for state.loadingProcess.status: '${value}'`);
        }
        break;
      case 'modalContents':
        renderModalContents(modal, modalContents);
        break;
      default:
        throw new Error(`Unknown state path: ${path}`);
    }
  });
  return watchedState;
};
