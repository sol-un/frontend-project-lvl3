import $ from 'jquery';
import _ from 'lodash';

const renderStrings = (t) => {
  $('#deleteAllButton').text(t('deleteAllButton'));
  $('#header').text(t('header'));
  $('#pitch').html(t('pitch'));
  $('#addButton').text(t('addButton'));
};

const renderActiveChannel = (url) => {
  $('.nav-link').each((_i, el) => $(el).removeClass('active'));
  $(`a[data-url="${url}"]`).addClass('active');
  $('.tab-pane').each((_i, el) => $(el).removeClass('active'));
  $(`div[data-url="${url}"]`).addClass('active');
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

  const cardTitle = document.createElement('h4');
  $(cardTitle)
    .addClass('card-title')
    .text(title)
    .appendTo(cardBody);

  if (creator) {
    const cardSubtitle = document.createElement('h6');
    $(cardSubtitle).addClass('card-subtitle')
      .addClass('text-muted')
      .text(`${t('creator')} ${creator}`)
      .appendTo(cardBody);
  }

  const cardDescription = document.createElement('p');
  $(cardDescription)
    .addClass('card-text mt-4')
    .html(description)
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
    const time = `${normalizedDate.getHours()}:${normalizedDate.getMinutes()}`;
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

const renderContents = (item, articles, t) => {
  const filteredArticles = articles.filter(({ url }) => url === item.url);
  const div = document.createElement('div');
  $(div)
    .attr('data-url', item.url)
    .addClass('tab-pane')
    .appendTo($('.tab-content'));

  filteredArticles.reduce((acc, article) => {
    const card = renderCard(article, t);
    acc.append(card);
    return acc;
  }, $(div));

  return div;
};

const renderTab = (acc, { url, title }, state) => {
  const li = document.createElement('li');
  $(li)
    .addClass('nav-item')
    .appendTo(acc);

  const a = document.createElement('a');
  $(a).addClass('nav-link')
    .attr('data-toggle', 'tab')
    .attr('data-url', url)
    .attr('href', '#')
    .text(title)
    .on('click', (e) => {
      e.preventDefault();
      const activeChannelUrl = $(e.target).attr('data-url');
      _.set(state, 'activeChannelUrl', activeChannelUrl);
    })
    .appendTo(li);

  const span = document.createElement('span');
  $(span)
    .html('<b>&ensp;&times;</b>')
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

  return li;
};

export default (state, t) => {
  renderStrings(t);

  const {
    activeChannelUrl,
    link,
    linkStatus,
    channels,
    articles,
    error,
  } = state;

  $('input').val(link);

  if (error) {
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
  } else {
    $('.feedback')
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
    case 'loading':
      $('button')
        .attr('disabled', 'disabled');
      break;
    default:
          // nothing
  }

  const $mount = $('#channelNav');
  $mount.empty();

  if (channels.length === 0) {
    return $mount.html(`<div class="mt-4 text-center"><i>${t('noChannels')}</i></div>`);
  }

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

  return renderActiveChannel(activeChannelUrl);
};
