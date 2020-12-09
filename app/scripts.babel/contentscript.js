'use strict';

const debug = (name, value) => {
  // console.log(name, value);
};

const positives = ['+1', 'tada', 'heart', 'smile',];

function getEmojiButtons (item) {
  const buttonsEle = item.getElementsByClassName('reaction-summary-item');

  const buttonsJson = Array.prototype.map
    .call(buttonsEle, item => {
      const emoji = item.getElementsByTagName('g-emoji')[0];
      if (!emoji) {
        return {};
      }
      const alias = emoji.getAttribute('alias');
      const score = item.lastChild.textContent.trim() || 0;
      const icon = emoji.textContent.trim();

      return {
        emoji,
        score,
        icon,
        alias,
      };
    })
    .filter(item => item.emoji);
  return buttonsJson;
}

function getCommentsJson () {
  const comments = document.getElementsByClassName('js-comment-container');
  return Array.prototype.map.call(comments, (item, index) => {
    const offsetTop = item.offsetTop;
    const authorEle = item.querySelector('.author');
    if (!authorEle) {
      return {};
    }
    const author = authorEle.textContent;
    const avatar = item.querySelector('.avatar').getAttribute('src');
    const anchor = item.querySelector('.js-timestamp').getAttribute('href');
    const datetime = item.querySelector('relative-time').getAttribute('datetime');
    const roleEle = item.querySelector('.timeline-comment-label');
    let role = '';
    if (item.querySelector('.timeline-comment-label')) {
      role = roleEle.textContent.trim();
    }

    const buttons = getEmojiButtons(item);

    const scores = buttons
      .filter(item => positives.includes(item.alias))
      .reduce((prev, cur) => {
        return +cur.score + prev;
      }, 0);

    const eyes = buttons.reduce((prev, cur) => {
      return +cur.score + prev;
    }, 0);

    return {
      id: index,
      item,
      offsetTop,
      author,
      avatar,
      anchor,
      role,
      datetime,
      buttons,
      scores,
      eyes,
    };
  });
}

function sortByScoreEyes (anwsers) {
  return anwsers
    .sort((a, b) => {
      if (a.scores !== b.scores) {
        return -(a.scores - b.scores);
      } else {
        return -(a.eyes - b.eyes);
      }
    })
    .map((item, rank, arr) => {
      return {
        ...item,
        rank: rank,
      };
    });
}

const getListItem = (item, className) => {
  const li = document.createElement('li');
  console.log('li', li);

  const icons = item.buttons
    .map(e => {
      return `${e.icon} ${e.score}`;
    })
    .join(' ');

  const roleHtml = item.role
    ? `<span class="toc-divider"></span>
    <div title="${item.role}" class="toc-role">${item.role.slice(0, 1)}</div>`
    : '';

  li.innerHTML = `
  <a class="${className}" title="${item.author}" href="${item.anchor}" data-offset="${item.offsetTop
}">
    <img class="avatar" width="32" height="32" src="${item.avatar}">
    <div class="toc-detail">
      <div class="toc-emoji">${icons}</div>
      <div class="toc-author">${item.author}</div>
    </div>
    ${roleHtml}
  </a>`;

  return li;
};

const isExtLoaded = () => {
  const oldEle = document.getElementById('github-issue-toc');
  return !!oldEle;
};

let start = () => {
  let comments = getCommentsJson().filter(item => item.author);
  debug('comments', comments);

  if (comments.length === 0) {
    return;
  }
  const ask = comments[0];
  let answers = sortByScoreEyes(comments.slice(1));

  const sidebar =
    document.getElementById('partial-discussion-sidebar') ||
    document.getElementsByClassName('discussion-sidebar')[0];

  const tocContainer = document.createElement('div');
  tocContainer.id = 'github-issue-toc';

  const tocHeader = document.createElement('div');
  tocHeader.innerHTML = `<a target="_blank" href="https://github.com/wooodhead/github-issue-toc">
  <svg height="14" width="32"  class="octicon octicon-mark-github" viewBox="0 0 16 16" version="1.1" aria-hidden="true"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg>
  <span>github-issue-toc</span></a>
  `;

  tocHeader.id = 'github-issue-toc-header';

  const tocBody = document.createElement('div');
  tocBody.id = 'github-issue-toc-body';

  const askLi = getListItem(ask, 'toc-asker');
  tocBody.appendChild(askLi);

  const tocAnwsers = document.createElement('ul');
  tocAnwsers.id = 'toc-answers';

  answers.forEach(item => {
    const li = getListItem(item);
    tocAnwsers.appendChild(li);
  });

  tocBody.appendChild(tocAnwsers);

  tocContainer.appendChild(tocHeader);
  tocContainer.appendChild(tocBody);

  const old = document.getElementById('github-issue-toc');
  if (old) {
    sidebar.removeChild(old);
  }

  sidebar.appendChild(tocContainer);
};

const validateUrl = () => {
  var path = window.location.pathname;
  const arr = path.split('/');
  const isIssueNo = !!parseInt(arr.pop(), 10);
  const page = arr.pop();
  const isIssues = page === 'issues' || page === 'pull';
  return isIssueNo && isIssues;
};

const loop = () => {
  setInterval(function () {
    const isValid = validateUrl();
    if (isValid && !isExtLoaded()) {
      start();
    }
  }, 2000);
};

window.onload = () => {
  console.log('onload');
  const isValid = validateUrl();
  if (isValid) {
    start();
  }
  loop();
};
