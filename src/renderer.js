import $ from 'jquery';
import _ from 'lodash';
import i18next from 'i18next';

const t = (key, data) => i18next.t(key, data);

const renderStrings = () => {
  $('#deleteAllButton').text(t('deleteAllButton'));
  $('#header').text(t('header'));
  $('#pitch').html(t('pitch'));
  $('#addButton').text(t('addButton'));
  $('#collapseLinks > .card').html(t('suggestedLink'));
};

const renderActiveChannel = (url) => {
  $('.nav-link').each((_i, el) => $(el).removeClass('active'));
  $(`a[data-url="${url}"]`).addClass('active');
  $('.tab-pane').each((_i, el) => $(el).removeClass('active'));
  $(`div[data-url="${url}"]`).addClass('active');
};

const renderCard = ({
  id, title, description, link, creator, pubDate,
}, state) => {
  const card = document.createElement('div');
  $(card).addClass('card border-primary');

  const cardBody = document.createElement('div');
  $(cardBody)
    .addClass('card-body')
    .appendTo(card);

  const cardTitle = document.createElement('h4');
  $(cardTitle)
    .addClass(`card-title font-weight-${state.viewed.includes(link) ? 'normal' : 'bold'}`)
    .text(title)
    .appendTo(cardBody);

  if (creator) {
    const cardSubtitle = document.createElement('h6');
    $(cardSubtitle).addClass('card-subtitle')
      .addClass('text-muted')
      .text(`${t('creator')} ${creator}`)
      .appendTo(cardBody);
  }

  const previewButton = document.createElement('button');
  $(previewButton)
    .addClass('btn btn-primary my-3')
    .attr('type', 'button')
    .attr('data-toggle', 'modal')
    .attr('data-target', `#${id}`)
    .text(t('synopsis'))
    .on('click', () => {
      state.viewed.push(link);
    })
    .appendTo(cardBody);

  const modal = document.createElement('div');
  $(modal)
    .addClass('modal fade')
    .attr('id', id)
    .attr('tabindex', '-1')
    .attr('role', 'dialog')
    .attr('aria-labelledby', 'synopsisModal')
    .attr('aria-hidden', 'true')
    .html(
      `<div class="modal-dialog" role="document">
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
      </div>`,
    )
    .appendTo(cardBody);

  const cardFooter = document.createElement('p');
  $(cardFooter)
    .addClass('card-text')
    .appendTo(cardBody);

  if (pubDate) {
    const normalizedDate = new Date(pubDate);
    const day = normalizedDate.getDate();
    const month = normalizedDate.getMonth();
    const year = normalizedDate.getFullYear();
    const [digit1, digit2] = normalizedDate.getMinutes().toString();
    const minutes = digit2 ? `${digit1}${digit2}` : `0${digit1}`;
    const time = `${normalizedDate.getHours()}:${minutes}`;
    $(cardFooter)
      .append(`<div><i class="card-text">${t('pubDate', {
        time, day, month, year,
      })}</i></div>`);
  }

  if (link) {
    $(cardFooter)
      .append(`<div><b class="card-text">${t('link')}</b>: <a class="card-link" href="${link}" target="_blank">${link}</a></div>`);
  }

  return card;
};

const renderContents = (item, articles, state) => {
  const filteredArticles = articles.filter(({ url }) => url === item.url);
  const div = document.createElement('div');
  $(div)
    .attr('data-url', item.url)
    .addClass('tab-pane')
    .appendTo($('.tab-content'));

  filteredArticles.forEach((article) => {
    const card = renderCard(article, state);
    return $(div).append(card);
  });

  return div;
};

const renderTab = (mount, { url, title }, state) => {
  const navItem = document.createElement('li');
  $(navItem)
    .addClass('nav-item')
    .appendTo(mount);

  const a = document.createElement('a');
  $(a)
    .addClass('nav-link')
    .attr('data-toggle', 'tab')
    .attr('data-url', url)
    .attr('href', '#')
    .text(title)
    .on('click', (e) => {
      e.preventDefault();
      const activeChannelUrl = $(e.target).attr('data-url');
      _.set(state, 'activeChannelUrl', activeChannelUrl);
    })
    .appendTo(navItem);

  const span = document.createElement('span');
  $(span)
    .addClass('nav-delete')
    .html('<b>&emsp;&times;</b>')
    .appendTo(a);

  $(span).on('click', (e) => {
    e.stopPropagation();
    const { activeChannelUrl, channels, articles } = state;
    const urlToDelete = $(e.target).closest('a').attr('data-url');

    _.set(state, 'channels', _.filter(channels, (o) => o.url !== urlToDelete));
    _.set(state, 'articles', _.filter(articles, (o) => o.url !== urlToDelete));
    if (urlToDelete === activeChannelUrl) {
      _.set(state, 'activeChannelUrl', null);
    }
  });

  return navItem;
};

const renderFeedback = (state) => {
  const { error } = state;
  $('.feedback')
    .empty();

  const alert = document.createElement('div');
  $(alert)
    .addClass('alert alert-danger alert-dismissible fade show')
    .text(t(`errors.${error}`))
    .appendTo($('.feedback'));

  const button = document.createElement('button');
  $(button)
    .addClass('close')
    .attr('type', 'button')
    .attr('data-dismiss', 'alert')
    .appendTo($(alert));

  const span = document.createElement('span');
  $(span)
    .html('&times;')
    .appendTo($(button));
  $('.feedback')
    .fadeIn(100);

  $(span).on('click', () => _.set(state, 'error', null));
};

const renderFeeds = (state) => {
  const { channels, articles } = state;

  const $mount = $('#channelNav');
  $mount.empty();

  if (channels.length === 0) {
    return $mount.html(`<div class="mt-4 text-center"><i>${t('noChannels')}</i></div>`);
  }

  const ul = document.createElement('ul');
  $(ul)
    .attr('id', 'myTab')
    .addClass('nav nav-pills flex-column flex-sm-row')
    .appendTo($mount);

  const div = document.createElement('div');
  $(div)
    .addClass('tab-content')
    .appendTo($mount);

  return channels.forEach((item) => {
    const tab = renderTab($(ul), item, state);
    renderContents(item, articles, state);

    return $(ul).append(tab);
  });
};

const renderInput = (linkStatus) => {
  switch (linkStatus) {
    case 'valid':
      $('input')
        .removeClass('is-invalid');
      $('button')
        .removeAttr('disabled');
      break;
    case 'invalid':
      $('input')
        .addClass('is-invalid');
      $('button')
        .attr('disabled', 'disabled');
      break;
    case 'loading':
      $('button')
        .attr('disabled', 'disabled');
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

  $('input').val(link);

  if (error) {
    renderFeedback(state);
  } else {
    $('.feedback')
      .fadeOut(100);
  }

  renderInput(linkStatus);

  renderFeeds(state);
  return renderActiveChannel(activeChannelUrl);
};
