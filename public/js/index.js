$(document).ready(function(){

  let authedUser = '', contentData = {}, userData = {};
  renderPics();

  // Toggling between all and user's pics
  $('#allPics a').on('click', () => {
    if ($('#allPics a').attr('class') === 'selected' || !authedUser) return;

    $('#myPics a').attr('class', '');
    $('#allPics a').attr('class', 'selected');
    $('#ocMyPics').removeClass('selected');
    $('#ocAllPics').addClass('selected');

    renderPics();
  });
  $('#myPics a').on('click', () => {
    if ($('#myPics a').attr('class') === 'selected' || !authedUser) return;

    $('#allPics a').attr('class', '');
    $('#myPics a').attr('class', 'selected');
    $('#ocAllPics').removeClass('selected');
    $('#ocMyPics').addClass('selected');

    renderPics(false, `/${authedUser}`);
  });
  $('#ocAllPics').on('click', () => {
    if ($('#ocAllPics').hasClass('selected') || !authedUser) return;

    $('#ocMyPics').removeClass('selected');
    $('#ocAllPics').addClass('selected');
    $('#myPics a').attr('class', '');
    $('#allPics a').attr('class', 'selected');

    renderPics();
  });
  $('#ocMyPics').on('click', () => {
    if ($('#ocMyPics').hasClass('selected') || !authedUser) return;

    $('#ocAllPics').removeClass('selected');
    $('#ocMyPics').addClass('selected');
    $('#allPics a').attr('class', '');
    $('#myPics a').attr('class', 'selected');

    renderPics(false, `/${authedUser}`);
  });

  // Toggling dropdown
  const toggleFormContainer = (query) => {
    let formContainer = $(query);
    formContainer.css('display') === 'none'
    ? formContainer.slideDown(325)
    : formContainer.slideUp(325);
  }
  $('#addPic a').on('click', () => {
    toggleFormContainer('.dd-form-container');
    
    if ($('.dd-form-container').css('display') !== 'none') {
      // Dropdown blur
      $(document).on('click', e => {
        if ($('#addPic').has(e.target).length) return; 

        // Close dropdown if blur 
        const form = $('#dd-form'),
        formContainer = $('.dd-form-container');

        if (form[0] !== e.target && !form.has(e.target).length) {
          formContainer.slideUp(325);
        }
      });

      return;
    }

    $(document).off('click');
    
  });
  $('#ocAddPic').on('click', () => toggleFormContainer('.oc-dd-form-container'));

  // Submitting Form
  let submitLock = false;
  $('.form-submit-btn').on('click', e => {
    if (submitLock || !authedUser) return;
    submitLock = true;
    postAjax(
      e, 
      $('#form-pic-url').val(),
      $('#form-pic-desc').val()
    );
  });
  $('.oc-form-submit-btn').on('click', e => {
    if (submitLock || !authedUser) return;
    submitLock = true;
    postAjax(
      e, 
      $('#oc-form-pic-url').val(),
      $('#oc-form-pic-desc').val()
    );
  });
  $('#dd-form').on('submit', e => e.preventDefault());
  $('#oc-dd-form').on('submit', e => e.preventDefault());

  // Github auth / logout
  let authLock = false;
  $('#logBtn').on('click', () => {
    if (authLock || authedUser) return;
    authLock = true;
    window.location.href = '/auth/github';
  });
  $('#ocLogBtn').on('click', () => {
    if (authLock || authedUser) return;
    authLock = true;
    window.location.href = '/auth/github';
  });
  $('#logOut a').on('click', () => {
    if (authLock || !authedUser) return;
    authLock = true;

    $.ajax({
      type: 'DELETE',
      url: '/',
      success: () => {
        location.reload();
      },
      error: resp => {
        const errMsg = resp.responseJSON.error;
        alert(errMsg);
      }
    });
  });

  // Responsive nav open/close
  $('.closenav').on('click', () => {
    const navWidth = $('.offcanvas-nav').width();
    $('.content-wrapper').animate({ 'opacity': 1 }, 480);
    $('.offcanvas-nav').animate({ left: `-${navWidth+20}px` }, 480, () => {
      $('.content-wrapper').css('pointerEvents', 'auto');
    });
  });
  $('#openNav').on('click', () => {
    $('.content-wrapper')
    .css('pointerEvents', 'none')
    .animate({ 'opacity': 0.45 }, 480);
    $('.offcanvas-nav').animate({ left: `0` }, 480);
  });
  
  // Clear err msg when typing in input
  $('#form-pic-url').on('keypress', e => {
    $('.err-msg').text('');
  });
  $('#form-pic-desc').on('keypress', () => {
    $('.err-msg').text('');
  });
  $('#oc-form-pic-url').on('keypress', () => {
    $('.oc-err-msg').text('');
  });
  $('#oc-form-pic-desc').on('keypress', () => {
    $('.oc-err-msg').text('');
  })

  // Offcanvas Content
  const OccContent = {
    open: (transitionMs, cbFn) => {
      if ($('.offcanvas-content').css('display') !== 'none') return;

      $('.content-wrapper').css('pointerEvents', 'none').animate({
        'opacity': 0.45
      }, transitionMs);
      $('.offcanvas-content').css({
        'display': 'flex',
        'opacity': 0
      }).animate({ 'opacity': 1 }, transitionMs, () => {
        $(document).on('click', e => {
          const occCont = $('.offcanvas-content');
          if (occCont[0] !== e.target && !occCont.has(e.target).length) {
            OccContent.close(120);
          }
        });
      }, cbFn); 
    },
    close: (transitionMs, cbFn) => {
      if ($('.offcanvas-content').css('display') === 'none') return;

      $(document).off('click');

      $('.content-wrapper').animate({ 'opacity': 1 }, transitionMs, () => {
        $('.content-wrapper').css('pointerEvents', 'auto');
        $('.content-wrapper').click();
      });

      $('.offcanvas-content').fadeOut(transitionMs, cbFn);
    }
  };
  $('#closeOccContent').on('click', () => OccContent.close(120));
  $('#starPic').on('click', () => {
    if (!authedUser) return;
    const id = $('.offcanvas-content').attr('content_id'),
    starred = !($('#starPic i').attr('class') === 'fa-solid fa-star');

    let starCount = parseInt($('#occ-stars span').text());

    if (!starred) {
      $('#starPic i').attr('class', 'fa-regular fa-star');
      $('.star-status').text('Star');
      $('#occ-stars span').text(starCount-1);

      contentData[id].starred -= 1
      let index = userData[authedUser].picStarred.indexOf(id);
      userData[authedUser].picStarred.splice(index, 1);
    } else {
      $('#starPic i').attr('class', 'fa-solid fa-star');
      $('.star-status').text('Starred');
      $('#occ-stars span').text(starCount+1)
      contentData[id].starred += 1

      userData[authedUser].picStarred.push(id);
    }
    
    $('#starPic').css('pointerEvents', 'none');
    $.ajax({
      method: 'PUT',
      url: '/api/pic',
      data: { id, starred },
      success: () => {
        $('#starPic').css('pointerEvents', 'auto');
      },
      error: resp => {
        const errMsg = resp.responseJSON.error;
        console.error(errMsg);
      }
    });
    
  });
  $('#deletePic').on('click', () => {
    if (!authedUser) return;
    const id = $('.offcanvas-content').attr('content_id');

    if(!confirm('Are you sure you want to delete this pic?')) return;

    $(document).off('click');
    $('body').css('pointerEvents', 'none').animate({ 'opacity': 0.67 }, 650);
    
    $.ajax({
      method: 'DELETE',
      url: '/api/pic',
      data: { id },
      success: () => {
        OccContent.close(400, () => {

          if ($('#myPics a').attr('class') === 'selected' || $('#ocMyPics').attr('class') === 'selected') {
            renderPics(false, `/${authedUser}`);
          } else {
            renderPics();
          }

          $('body').animate({ 'opacity': 1 }, 650, () => {
            $('body').css('pointerEvents', 'auto');
          });
        });
      },
      error: resp => {
        const errMsg = resp.responseJSON.error;
        alert(`Could not delete: ${errMsg}`);
      }
    });

  });
  
  function renderPics(isAll = true, user = '') {
    $('.content').css('display', 'none');
    $('.content').empty();
    $('.loading').css('display', 'flex');

    try {
      let ajaxRoute;

      ajaxRoute = isAll ? '/api/pic' : `/api/user${user}`;

      $.ajax({ 
        url: ajaxRoute, 
        method: 'GET',
        success: handleRenderSuccess,
        error: () => {
          $('.loading').css('display', 'none');
          $('.content')
          .empty()
          .isotope()
          .isotope('destroy');
        }
      });

    } catch(err) {
      console.error(err);
    }
  }

  function postAjax(evnt, picUrl, picDesc) {
    evnt.preventDefault();

    return $.ajax({
      method: 'POST',
      url: '/api/pic',
      data: { picUrl, picDesc },
      success: handlePostSuccess,
      error: handlePostError
    });

  }

  function handleRenderSuccess(dataObj) {
    $('.loading').css('display', 'none');

    contentData = {};
    userData = {};

    if (dataObj.hasOwnProperty('user')) {
      authedUser = dataObj.user.username;

      $('#onlyAuthed').css('display', 'flex');
      $('#logBtn').css('display', 'none');

      $('#oc-onlyAuthed').css('display', 'block');
      $('#oc-nav-user').css('display', 'block');
      $('#ocLogBtn').css('display', 'none');
      
      $('#nav-user').html(`
        <button type="button" class="nav-user-btn">
          <img class="user-pfp" src="${dataObj.user.avatar}" alt="user profile" />
          <span class="user-name">${dataObj.user.username} <i class="fa-solid fa-angle-down"></i></span>
        </button>
      `);
      $('.github-link').attr('href', dataObj.user.html_url);

      $('.nav-user-btn').on('click', () => {
        toggleFormContainer('.user-dd-content');

        if ($('.user-dd-content').css('display') !== 'none') {
          // Dropdown blur
          $(document).on('click', e => {
            if($('.nav-user-btn').has(e.target).length) return; 

            // Close dropdown if blur 
            const ddContent = $('.user-dd-content');
    
            if (ddContent[0] !== e.target && !ddContent.has(e.target).length) {
              ddContent.slideUp(325);
            }
          });
    
          return;
        }
    
        $(document).off('click');
      });

      $('.user-dd-container').css('display', 'block');

    }

    // Save to userData
    $.ajax({
      url: '/api/users',
      method: 'GET',
      success: dataObj => {
        for (let i = 0; i < dataObj.users.length; i++) {
          const user = dataObj.users[i];
          userData[user.username] = {
            id: user.id,
            avatar: user.avatar,
            html_url: user.html_url,
            joined_date: user.joined_date,
            uploaded_count: user.uploaded_count,
            picStarred: user.picStarred
          }; 
        }
      },
      error: resp => {
        const errMsg = resp.responseJSON.error;
        console.error(errMsg);
      }
    });

    // Append Images & save to contentData
    for (let i = 0; i < dataObj.pics.length; i++) {
      const data = dataObj.pics[i];
      contentData[data._id] = {
        avatar: data.avatar,
        picDesc: data.picDesc,
        picUrl: data.picUrl,
        starred: data.starred,
        uploaded_on: data.uploaded_on,
        user: data.user
      };

      $('.content').append(`
      <div class="content-item" item_id="${data._id}">
        <div class="content-pic-container">
          <img class="content-img" src="${data.picUrl}" alt="" />
        </div>
      </div>
      `);
    }

    $('.content-img').on('error', e => {
      $(e.target)
      .attr('prev_src', $(e.target).attr('src'))
      .attr('src', '/assets/img/fallback.png')
      .css({
        'width': 360,
        'height': 200
      });

      const itemId = $(e.target).parents('.content-item').attr('item_id');
      content = contentData[itemId];
      content.picUrl = '/assets/img/fallback.png';
    });
    $('.content-pic-container').imagesLoaded(() => {
      $('.content').isotope().isotope('destroy');

      $('.content')
      .css('display', 'grid')
      .isotope({
        itemSelector: '.content-item',
        masonry: {
          fitWidth: true
        }
      });
    });

    $('.content-item').on('click', e => {
      const itemId = $(e.target).parents('.content-item').attr('item_id');
      const content = contentData[itemId];
      let avatar = dataObj.hasOwnProperty('avatar') ? dataObj.avatar : userData[content.user].avatar,
      username = dataObj.hasOwnProperty('username') ? dataObj.username : content.user;

      if (authedUser) {
        $('#starPic').attr('class', '');
        $('#deletePic').attr('class', '');

        if (userData[authedUser].picStarred.includes(itemId)) {
          $('#starPic i').attr('class', 'fa-solid fa-star');
          $('.star-status').text('Starred');          
        } else {
          $('#starPic i').attr('class', 'fa-regular fa-star');
          $('.star-status').text('Star');
        }

        $('#deletePic').css('display', 'block');
      }

      $('.offcanvas-content').attr('content_id', itemId);
      $('#occ-pic').attr('src', content.picUrl);
      $('#occ-avatar').attr('src', avatar);
      $('#occ-username').text(username);
      $('#occ-stars span').text(content.starred);
      $('#occ-date span').text(content.uploaded_on);
      $('#occ-description span').text(content.picDesc);

      OccContent.open(220);
    });

  }

  function handlePostSuccess() {
    if ($('.dd-form-container').css('display') !== 'none') {
      $('#form-pic-url').val('');
      $('#form-pic-desc').val('');
      toggleFormContainer('.dd-form-container');
    }

    if ($('.oc-dd-form-container').css('display') !== 'none') {
      $('#oc-form-pic-url').val('');
      $('#oc-form-pic-desc').val('');
      toggleFormContainer('.oc-dd-form-container');
    }

    if ($('#myPics a').attr('class') === 'selected' || $('#ocMyPics').attr('class') === 'selected') {
      renderPics(false, `/${authedUser}`);
    } else {
      renderPics();
    }
    
    submitLock = false;
  }
  function handlePostError(resp) {
    const displayErr = msg => {
      switch($(evnt.target).attr('id')) {
        case 'dd-form':
          $('.err-msg').text(msg);
          break;
        case 'oc-dd-form':
          $('.oc-err-msg').text(msg);
      }
    }

    const errMsg = resp.responseJSON.error;
    switch(resp.status) {
      case 400:
      case 401:
        displayErr(errMsg);
        break;
      case 500:
        alert('POST request failed - internal server error:\n' + errMsg);
        break;
      default: 
        alert('POST request failed:\n' + errMsg);
    }
  }

  
});