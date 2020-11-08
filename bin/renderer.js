import $ from 'jquery';
import _ from 'lodash';

const renderStrings = (t) => {
  $('#deleteAllButton').text(t('deleteAllButton'));
  $('#header').text(t('header'));
  $('#pitch').html(t('pitch'));
  $('#addButton').text(t('addButton'));
};

const renderActiveChannel = (id) => {
  $('.nav-link').each((_i, el) => $(el).removeClass('active'));
  $(`a[data-id="${id}"]`).addClass('active');
  $('.tab-pane').each((_i, el) => $(el).removeClass('active'));
  $(`div[data-id="${id}"]`).addClass('active');
};

const renderCard = ({
  title, description, link, creator, pubDate,
}, t) => {
  const card = document.createElement('div');
  $(card).addClass('card');

  const cardBody = document.createElement('div');
  $(cardBody)
    .addClass('card-body')
    .appendTo(card);

  const cardTitle = document.createElement('h5');
  $(cardTitle)
    .addClass('mb-2')
    .text(title)
    .appendTo(cardBody);

  if (creator) {
    const cardSubtitle = document.createElement('h6');
    $(cardSubtitle).addClass('card-subtitle')
      .addClass('mb-3')
      .addClass('text-muted')
      .text(`${t('creator')} ${creator}`)
      .appendTo(cardBody);
  }

  const cardDescription = document.createElement('p');
  $(cardDescription)
    .html(description)
    .appendTo(cardBody);

  const cardData = document.createElement('div');
  $(cardData)
    .appendTo(cardBody);

  if (pubDate) {
    $(cardData)
      .append(`<div><i>${t('pubDate')} ${new Date(pubDate).toLocaleDateString()}</i></div>`);
  }

  if (link) {
    $(cardData)
      .append(`<b>${t('link')} </b>`)
      .append(`<a href="${link}" target="_blank">${link}</a>`)
      .appendTo(cardBody);
  }

  return card;
};

const renderContents = (item, articles, t) => {
  const filteredArticles = articles.filter(({ id }) => id === item.id);
  const div = document.createElement('div');
  $(div)
    .attr('data-id', item.id)
    .addClass('tab-pane')
    .appendTo($('.tab-content'));

  filteredArticles.reduce((acc, article) => {
    const card = renderCard(article, t);
    acc.append(card);
    return acc;
  }, $(div));

  return div;
};

const renderTab = (acc, { id, title }, state) => {
  const li = document.createElement('li');
  $(li)
    .addClass('nav-item')
    .appendTo(acc);

  const a = document.createElement('a');
  $(a).addClass('nav-link')
    .attr('data-toggle', 'tab')
    .attr('data-id', id)
    .attr('href', '#')
    .text(title)
    .on('click', (e) => {
      e.preventDefault();
      const activeChannelId = $(e.target).attr('data-id');
      _.set(state, 'activeChannelId', activeChannelId);
    })
    .appendTo(li);

  return li;
};

export default (state, t) => {
  renderStrings(t);
  const $mount = $('#channelNav');
  const {
    activeChannelId,
    link,
    linkStatus,
    channels,
    articles,
    error,
  } = state;

  if (channels.length === 0) {
    return $mount.html(`<div class="mt-4 text-center"><i>${t('noChannels')}</i></div>`);
  }

  $('input').val(link);

  if (error) {
    $('.feedback')
      .html(`<div class="alert alert-danger" role="alert">${t(`errors.${error}`)} (${t('removeError')})</div>`)
      .fadeIn(100);
    $('.feedback').on('click', (e) => $(e.target).remove());
  } else {
    $('.feedback').empty()
      .fadeOut(100);
  }

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
    default:
      // nothing
  }

  $mount.empty();

  const ul = document.createElement('ul');
  $(ul)
    .attr('id', 'myTab')
    .addClass('nav nav-pills')
    .appendTo($mount);

  const div = document.createElement('div');
  $(div)
    .addClass('tab-content')
    .appendTo($mount);

  channels.reduce((acc, item) => {
    const tab = renderTab(acc, item, state);
    renderContents(item, articles, t);

    acc.append(tab);
    return acc;
  }, $(ul));

  return renderActiveChannel(activeChannelId);
};
