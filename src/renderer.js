/* eslint-disable no-param-reassign */

import onChange from 'on-change';

const renderModalContents = (modalNodes, { posts, modalContentsId }) => {
  const { title, description } = posts.find(({ id }) => id === modalContentsId);
  const { modalTitle, modalBody } = modalNodes;
  modalTitle.textContent = title;
  modalBody.textContent = description;
};

const renderSuccessMessage = (container, t) => {
  container.textContent = `
  <div class="alert alert-info fade show">
    ${t('loadingSuccess')}
  </div>
  `;
};

const renderErrorMessage = (container, error, t) => {
  container.textContent = `
  <div class="alert alert-danger fade show">
    ${t(`errors.${error}`)}
  </div>
  `;
};

const renderChannels = (container, { channels }, t) => {
  container.textContent = '';

  const channelCards = channels.map(({ title, description }) => `
    <div class="card">
      <div class="card-body">
        <h3 class="card-title">${title}</h3>
        <p class="card-text">${description}</p>
      </div>
    </div>`);

  container.textContent = `<h2 class="mt-4">${t('channels')}</h2>${channelCards.join('')}`;
};

const renderPosts = (container, { posts, uiState }, t) => {
  if (posts.length === 0) {
    return;
  }

  container.textContent = '';

  const postCards = posts.map(({
    id, title, link, creator,
  }) => {
    const fontWeightValue = uiState.viewedPosts.has(id)
      ? 'normal'
      : 'bold';
    const creatorSubtitle = creator
      ? `<h6 class="card-subtitle text-muted">${t('creator')} ${creator}</h6>`
      : '';
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
          ${creatorSubtitle}
          <button
            class="btn btn-primary my-3"
            type="button"
            role="button"
            aria-label="просмотр"
            data-id="${id}"
            data-toggle="modal"
            data-target="#previewModal"
          >
            ${t('synopsis')}
          </button>
        </div>
      </div>
    `;
  });
  container.textContent = `<h2 class="mt-5">${t('posts')}</h2>${postCards.join('')}`;
};

const disableForm = ({ input, button }) => {
  input.setAttribute('readonly', 'readonly');
  button.setAttribute('disabled', '');
};

const enableForm = ({ input, button }) => {
  input.removeAttribute('readonly');
  button.removeAttribute('disabled');
};

const handleForm = (value, nodeDispatcher, t) => {
  const { valid, error } = value;
  const { flashContainer, input } = nodeDispatcher;

  if (error) {
    renderErrorMessage(flashContainer, error, t);
  }

  if (!valid) {
    input.classList.add('is-invalid');
  } else {
    input.classList.remove('is-invalid');
  }
};

const handleLoadingProcess = (value, nodeDispatcher, t) => {
  const { status, error } = value;
  const { flashContainer, input } = nodeDispatcher;

  if (error) {
    renderErrorMessage(flashContainer, error, t);
    enableForm(nodeDispatcher);
    return;
  }

  switch (status) {
    case 'success':
      input.value = '';
      renderSuccessMessage(flashContainer, t);
      enableForm(nodeDispatcher);
      break;
    case 'fetching':
      disableForm(nodeDispatcher);
      break;
    default:
      throw new Error(`Unknown property for state.loadingProcess.status: '${value}'`);
  }
};

export default (state, nodeDispatcher, t) => {
  const {
    modal,
    channelsContainer,
    postsContainer,
  } = nodeDispatcher;

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form':
        handleForm(value, nodeDispatcher, t);
        break;
      case 'channels':
        renderChannels(channelsContainer, state, t);
        break;
      case 'posts':
      case 'uiState.viewedPosts':
        renderPosts(postsContainer, state, t);
        break;
      case 'loadingProcess': {
        handleLoadingProcess(value, nodeDispatcher, t);
        break;
      }
      case 'modalContentsId':
        renderModalContents(modal, state);
        break;
      default:
        throw new Error(`Unknown state path: ${path}`);
    }
  });
  return watchedState;
};
