export default {
  months: {
    0: 'января',
    1: 'февраля',
    2: 'марта',
    3: 'апреля',
    4: 'мая',
    5: 'июня',
    6: 'июля',
    7: 'августа',
    8: 'сентября',
    9: 'октября',
    10: 'ноября',
    11: 'декабря',
  },
  translation: {
    deleteAllButton: 'Сбросить',
    header: 'А вы пользуетесь RSS?',
    pitch: 'Если еще нет, то попробуйте прямо сейчас! Это бесплатно. Вот как можно оставаться в курсе всех последних новостей, используя RSS: найдите интересующую вас <a data-toggle="collapse" href="#collapseLinks" role="button" aria-expanded="false" aria-controls="collapseExample">RSS-ленту</a>, вставьте ссылку на нее в поле ниже и нажмите кнопку <i>Добавить</i>:',
    suggestedLink: 'Например: <u class="user-select-all">https://ru.hexlet.io/blog.rss</u><u class="user-select-all">https://www.liga.net/news/sport/rss.xml</u>',
    addButton: 'Добавить',
    creator: 'Автор: ',
    synopsis: 'Предпросмотр',
    pubDate: 'Опубликовано в {{time}}, {{day}} $t(months:{{month}}) {{year}} г.',
    link: 'Источник',
    errors: {
      network: 'Ошибка соединения!',
      nodata: 'Это не RSS-канал!',
      url: 'Ссылка содержит ошибку или имеет неподдерживаемый формат!',
      notOneOf: 'Вы уже добавили эту ленту!',
    },
    noChannels: 'Пока вы не добавили ни одной ленты...',
    removeError: 'нажмите чтобы убрать',
  },
};
