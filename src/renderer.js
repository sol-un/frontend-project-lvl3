/* eslint-disable no-param-reassign */

import onChange from 'on-change';

const renderModalContents = (modalNodes, { title, description }) => {
  const { modalTitle, modalBody } = modalNodes;
  modalTitle.textContent = title;
  modalBody.textContent = description;
};

const renderSuccessMessage = (container, t) => {
  container.innerHTML = `
  <div class="alert alert-info fade show">
    ${t('loadingSuccess')}
  </div>
  `;
};

const renderErrorMessage = (container, error, t) => {
  container.innerHTML = `
  <div class="alert alert-danger fade show">
    ${t(`errors.${error}`)}
  </div>
  `;
};

const renderChannels = (container, channels, t) => {
  container.innerHTML = '';

  const channelCards = channels.map(({ title, description }) => `
    <div class="card">
      <div class="card-body">
        <h3 class="card-title">${title}</h3>
        <p class="card-text">${description}</p>
      </div>
    </div>`);

  container.innerHTML = `<h2 class="mt-4">${t('channels')}</h2>${channelCards.join('')}`;
};

const renderPosts = (container, { posts, uiState }, t) => {
  if (posts.length === 0) {
    return;
  }

  container.innerHTML = '';

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
  container.innerHTML = `<h2 class="mt-5">${t('posts')}</h2>${postCards.join('')}`;
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
    modal,
    input,
    channelsContainer,
    postsContainer,
  } = nodeDispatcher;

  const watchedState = onChange(state, (path, value) => {
    const {
      form,
      loadingProcess,
      modalContents,
      channels,
    } = state;

    switch (path) {
      case 'form': {
        const { status, error } = value;

        if (error) {
          renderErrorMessage(flashContainer, form.error);
          return;
        }

        switch (status) {
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
      }
      case 'channels':
        renderChannels(channelsContainer, channels);
        break;
      case 'posts':
      case 'uiState.viewedPosts':
        renderPosts(postsContainer, state);
        break;
      case 'loadingProcess': {
        const { status, error } = value;

        if (error) {
          renderErrorMessage(flashContainer, loadingProcess.error);
          enableForm(nodeDispatcher);
          return;
        }

        switch (status) {
          case 'success':
            input.value = '';
            renderSuccessMessage(flashContainer);
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
      }
      case 'modalContents':
        renderModalContents(modal, modalContents);
        break;
      default:
        throw new Error(`Unknown state path: ${path}`);
    }
  });
  return watchedState;
};
