/* eslint-disable no-param-reassign */

import $ from 'jquery';
import _ from 'lodash';
import { formatDate, t } from './utils.js';

const renderStrings = (nodes) => {
  const {
    header, pitch, addButton, suggestedLink,
  } = nodes;

  header.innerText = t('header');
  pitch.innerHTML = t('pitch', { linkText: 'RSS', addButtonText: '$t(addButton)' });
  addButton.innerText = t('addButton');
  suggestedLink.innerHTML = t('suggestedLinks', { link1: '$t(link1)', link2: '$t(link2)' });
};

const renderModalContents = (modalNodes, { title, description }) => {
  const { modalTitle, modalBody } = modalNodes;
  modalTitle.innerText = title;
  modalBody.innerHTML = description;
};

const renderActiveChannel = ({
  navLinks, activeLink, navPanes, activePane,
}) => {
  navLinks.forEach((el) => el.classList.remove('active'));
  if (activeLink) {
    activeLink.classList.add('active');
  }

  navPanes.forEach((el) => el.classList.remove('active'));
  if (activePane) {
    activePane.classList.add('active');
  }
};

const renderCard = ({
  id, title, description, link, creator, pubDate,
}, state) => {
  const cardFragment = new DocumentFragment();

  const card = document.createElement('div');
  card.classList.add('card', 'border-primary');
  cardFragment.append(card);

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');
  card.append(cardBody);

  const cardTitle = document.createElement('h4');
  cardTitle.classList.add('card-title', `font-weight-${state.uiState.viewedPosts.includes(id) ? 'normal' : 'bold'}`);
  cardTitle.innerText = title;
  cardBody.append(cardTitle);

  if (creator) {
    const cardSubtitle = document.createElement('h6');
    cardSubtitle.classList.add('card-subtitle');
    cardSubtitle.classList.add('text-muted');
    cardSubtitle.innerText = `${t('creator')} ${creator}`;
    cardBody.append(cardSubtitle);
  }

  const previewButton = document.createElement('button');
  previewButton.classList.add('btn', 'btn-primary', 'my-3');
  previewButton.setAttribute('type', 'button');
  previewButton.innerText = t('synopsis');
  previewButton.addEventListener('click', () => {
    state.modalContents = { title, description };
    if (!state.uiState.viewedPosts.includes(id)) {
      state.uiState.viewedPosts.push(id);
    }
    $('#previewModal').modal('toggle');
  });
  cardBody.append(previewButton);

  const cardFooter = document.createElement('p');
  cardFooter.classList.add('card-text');
  cardBody.append(cardFooter);

  if (pubDate) {
    const pubDateContainer = document.createElement('div');
    pubDateContainer.innerHTML = `<i class="card-text">${t('pubDate', formatDate(pubDate))}</i>`;
    cardFooter.append(pubDateContainer);
  }

  if (link) {
    const linkContainer = document.createElement('div');
    linkContainer.innerHTML = `<b class="card-text">${t('link')}</b>: <a class="card-link" href="${link}" target="_blank">${link}</a>`;
    cardFooter.append(linkContainer);
  }

  return cardFragment;
};

const renderContents = (contentsDiv, item, posts, state) => {
  const filteredPosts = posts.filter(({ channelId }) => channelId === item.id);
  const div = document.createElement('div');
  div.setAttribute('data-id', item.id);
  div.classList.add('tab-pane');
  contentsDiv.append(div);

  filteredPosts.forEach((post) => {
    const card = renderCard(post, state);
    return div.append(card);
  });

  return div;
};

const renderTab = (mount, { id, link, title }, state) => {
  const navItem = document.createElement('li');
  navItem.classList.add('nav-item');
  mount.append(navItem);

  const a = document.createElement('a');
  a.classList.add('nav-link');
  a.setAttribute('data-toggle', 'tab');
  a.setAttribute('data-id', id);
  a.setAttribute('data-link', link);
  a.setAttribute('href', '#');
  a.innerText = title;
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const activeChannelId = e.target.getAttribute('data-id');
    state.uiState.activeChannel = activeChannelId;
  });
  navItem.append(a);

  const span = document.createElement('span');
  span.classList.add('nav-delete');
  span.innerHTML = '<b>&emsp;&times;</b>';
  a.append(span);

  span.addEventListener('click', (e) => {
    e.stopPropagation();
    const {
      uiState, channels, posts, addedLinks,
    } = state;
    const idToDelete = e.target.closest('a').getAttribute('data-id');
    const linkToDelete = e.target.closest('a').getAttribute('data-link');

    state.channels = _.filter(channels, (o) => o.id !== idToDelete);
    state.posts = _.filter(posts, ({ channelId }) => channelId !== idToDelete);
    state.addedLinks = _.filter(addedLinks, (item) => item !== linkToDelete);

    if (idToDelete === uiState.activeChannel) {
      state.uiState.activeChannel = state.channels[0].id;
    }
  });

  return navItem;
};

const renderFeedback = (nodeDispatcher, error) => {
  const { flashContainer } = nodeDispatcher;
  flashContainer.innerHTML = `
    <div class="alert alert-${error ? 'danger' : 'info'} fade show">
      ${error ? t(`errors.${error}`) : 'Rss has been loaded'}
    </div>
  `;
};

const renderFeeds = (nodeDispatcher, state) => {
  const { channels, posts } = state;
  const { mount } = nodeDispatcher;

  mount.innerHTML = '';

  if (channels.length === 0) {
    mount.innerHTML = `<div class="mt-4 text-center"><i>${t('noChannels')}</i></div>`;
  }

  const ul = document.createElement('ul');
  ul.setAttribute('id', 'myTab');
  ul.classList.add('nav', 'nav-pills', 'flex-column', 'flex-sm-row');
  mount.append(ul);

  const contentsDiv = document.createElement('div');
  contentsDiv.classList.add('tab-content');
  mount.append(contentsDiv);

  return channels.forEach((item) => {
    const tab = renderTab(ul, item, state);
    renderContents(contentsDiv, item, posts, state);

    return ul.append(tab);
  });
};

const renderInput = (nodeDispatcher, { status, error }) => {
  const { input, button } = nodeDispatcher;
  if (error) {
    input.classList.add('is-invalid');
  } else {
    input.classList.remove('is-invalid');
  }
  switch (status) {
    case 'active':
      button.removeAttribute('disabled');
      break;
    case 'disabled':
      button.setAttribute('disabled', '');
      break;
    default:
          // nothing
  }
};

export default (state) => {
  const {
    form,
    loadingProcess,
    uiState,
    modalContents,
  } = state;

  const nodeDispatcher = {
    modal: {
      modalTitle: document.querySelector('#previewModalTitle'),
      modalBody: document.querySelector('#previewModalBody'),
    },
    input: document.querySelector('input'),
    button: document.querySelector('#addButton'),
    mount: document.querySelector('#channelNav'),
    flashContainer: document.querySelector('.feedback'),
    i18n: {
      header: document.querySelector('#header'),
      pitch: document.querySelector('#pitch'),
      addButton: document.querySelector('#addButton'),
      suggestedLink: document.querySelector('#collapseLinks > .card'),
    },
  };

  nodeDispatcher.input.value = form.input;

  renderStrings(nodeDispatcher.i18n);

  renderInput(nodeDispatcher, form);

  renderFeeds(nodeDispatcher, state);

  renderModalContents(nodeDispatcher.modal, modalContents);

  if (form.error || loadingProcess.error) {
    renderFeedback(nodeDispatcher, form.error || loadingProcess.error);
  } else if (loadingProcess.status === 'success') {
    renderFeedback(nodeDispatcher);
  }
  const navDispatcher = {
    activeLink: document.querySelector(`a[data-id="${uiState.activeChannel}"]`),
    navLinks: [...document.querySelectorAll('.nav-link')],
    activePane: document.querySelector(`div[data-id="${uiState.activeChannel}"]`),
    navPanes: [...document.querySelectorAll('.tab-pane')],
  };

  renderActiveChannel(navDispatcher);
};
