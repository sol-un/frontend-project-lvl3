import $ from 'jquery';
import _ from 'lodash';
import i18next from 'i18next';

const t = (key, data) => i18next.t(key, data);

const renderStrings = () => {
  document.querySelector('#header').innerText = t('header');
  document.querySelector('#pitch').innerHTML = t('pitch');
  document.querySelector('#addButton').innerText = t('addButton');
  document.querySelector('#collapseLinks > .card').innerHTML = t('suggestedLink');
};

const renderActiveChannel = (url) => {
  const navLinks = [...document.querySelectorAll('.nav-link')];
  navLinks.forEach((el) => el.classList.remove('active'));
  const activeLink = document.querySelector(`a[data-url="${url}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }

  const navPanes = [...document.querySelectorAll('.tab-pane')];
  navPanes.forEach((el) => el.classList.remove('active'));
  const activePane = document.querySelector(`div[data-url="${url}"]`);
  if (activePane) {
    activePane.classList.add('active');
  }
};

const renderCard = ({
  id, title, description, link, creator, pubDate,
}, state) => {
  const card = document.createElement('div');
  card.classList.add('card', 'border-primary');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');
  card.append(cardBody);

  const cardTitle = document.createElement('h4');
  cardTitle.classList.add('card-title', `font-weight-${state.viewed.includes(link) ? 'normal' : 'bold'}`);
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
  previewButton.setAttribute('data-toggle', 'modal');
  previewButton.setAttribute('data-target', `#${id}`);
  previewButton.innerText = t('synopsis');
  previewButton.addEventListener('click', () => {
    state.viewed.push(link);
  });
  cardBody.append(previewButton);

  const modal = document.createElement('div');
  modal.classList.add('modal', 'fade');
  modal.setAttribute('id', id);
  modal.setAttribute('tabindex', '-1');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-labelledby', 'synopsisModal');
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="synopsisModal">${title}</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            ${description}
          </div>
        </div>
      </div>`;
  cardBody.append(modal);

  const cardFooter = document.createElement('p');
  cardFooter.classList.add('card-text');
  cardBody.append(cardFooter);

  if (pubDate) {
    const normalizedDate = new Date(pubDate);
    const day = normalizedDate.getDate();
    const month = normalizedDate.getMonth();
    const year = normalizedDate.getFullYear();
    const [digit1, digit2] = normalizedDate.getMinutes().toString();
    const minutes = digit2 ? `${digit1}${digit2}` : `0${digit1}`;
    const time = `${normalizedDate.getHours()}:${minutes}`;
    const pubDateContainer = document.createElement('div');
    pubDateContainer.innerHTML = `<i class="card-text">${t('pubDate', {
      time, day, month, year,
    })}</i>`;
    cardFooter.append(pubDateContainer);
  }

  if (link) {
    const linkContainer = document.createElement('div');
    linkContainer.innerHTML = `<b class="card-text">${t('link')}</b>: <a class="card-link" href="${link}" target="_blank">${link}</a>`;
    cardFooter.append(linkContainer);
  }

  return card;
};

const renderContents = (item, articles, state) => {
  const filteredArticles = articles.filter(({ url }) => url === item.url);
  const div = document.createElement('div');
  div.setAttribute('data-url', item.url);
  div.classList.add('tab-pane');
  document.querySelector('.tab-content').append(div);

  filteredArticles.forEach((article) => {
    const card = renderCard(article, state);
    return div.append(card);
  });

  return div;
};

const renderTab = (mount, { url, title }, state) => {
  const navItem = document.createElement('li');
  navItem.classList.add('nav-item');
  mount.append(navItem);

  const a = document.createElement('a');
  a.classList.add('nav-link');
  a.setAttribute('data-toggle', 'tab');
  a.setAttribute('data-url', url);
  a.setAttribute('href', '#');
  a.innerText = title;
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const activeChannelUrl = e.target.getAttribute('data-url');
    _.set(state, 'activeChannelUrl', activeChannelUrl);
  });
  navItem.append(a);

  const span = document.createElement('span');
  span.classList.add('nav-delete');
  span.innerHTML = '<b>&emsp;&times;</b>';
  a.append(span);

  span.addEventListener('click', (e) => {
    e.stopPropagation();
    const { activeChannelUrl, channels, articles } = state;
    const urlToDelete = e.target.closest('a').getAttribute('data-url');

    _.set(state, 'channels', _.filter(channels, (o) => o.url !== urlToDelete));
    _.set(state, 'articles', _.filter(articles, (o) => o.url !== urlToDelete));
    if (urlToDelete === activeChannelUrl) {
      _.set(state, 'activeChannelUrl', null);
    }
  });

  return navItem;
};

const renderErrorFeedback = (state) => {
  const { error } = state;
  const flashContainer = document.querySelector('.feedback');
  flashContainer.innerHTML = '';

  const alert = document.createElement('div');
  alert.classList.add('alert', 'alert-danger', 'alert-dismissible', 'fade', 'show');
  alert.innerText = t(`errors.${error}`);
  flashContainer.append(alert);

  const button = document.createElement('button');
  button.classList.add('close');
  button.setAttribute('type', 'button');
  button.setAttribute('data-dismiss', 'alert');
  alert.append(button);

  const span = document.createElement('span');
  span.innerHTML = '&times;';
  button.append(span);
  span.addEventListener('click', () => _.set(state, 'error', null));

  $('.feedback')
    .fadeIn(100);
};

const renderSuccessFeedback = (state) => {
  const flashContainer = document.querySelector('.feedback');
  flashContainer.innerHTML = '';

  const alert = document.createElement('div');
  alert.classList.add('alert', 'alert-info', 'alert-dismissible', 'fade', 'show');
  alert.innerText = 'Rss has been loaded';
  flashContainer.append(alert);

  const button = document.createElement('button');
  button.classList.add('close');
  button.setAttribute('type', 'button');
  button.setAttribute('data-dismiss', 'alert');
  alert.append(button);

  const span = document.createElement('span');
  span.innerHTML = '&times;';
  button.append(span);

  $('.feedback')
    .fadeIn(100);
};

const renderFeeds = (state) => {
  const { channels, articles } = state;

  const mount = document.querySelector('#channelNav');
  mount.innerHTML = '';

  if (channels.length === 0) {
    mount.innerHTML = `<div class="mt-4 text-center"><i>${t('noChannels')}</i></div>`;
  }

  const ul = document.createElement('ul');
  ul.setAttribute('id', 'myTab');
  ul.classList.add('nav', 'nav-pills', 'flex-column', 'flex-sm-row');
  mount.append(ul);

  const div = document.createElement('div');
  div.classList.add('tab-content');
  mount.append(div);

  return channels.forEach((item) => {
    const tab = renderTab(ul, item, state);
    renderContents(item, articles, state);

    return ul.append(tab);
  });
};

const renderInput = (linkStatus) => {
  const input = document.querySelector('input');
  const button = document.querySelector('button');
  switch (linkStatus) {
    case 'valid':
      input.classList.remove('is-invalid');
      button.removeAttribute('disabled');
      renderSuccessFeedback();
      break;
    case 'invalid':
      input.classList.add('is-invalid');
      button.setAttribute('disabled', 'disabled');
      break;
    case 'loading':
      button.setAttribute('disabled', 'disabled');
      break;
    default:
          // nothing
  }
};

export default (state) => {
  renderStrings();

  const {
    activeChannelUrl,
    link,
    linkStatus,
    error,
  } = state;

  document.querySelector('input').value = link;

  if (error) {
    renderErrorFeedback(state);
  } else {
    $('.feedback')
      .fadeOut(100);
  }

  renderInput(linkStatus);

  renderFeeds(state);
  return renderActiveChannel(activeChannelUrl);
};
