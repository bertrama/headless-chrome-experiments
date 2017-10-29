function remove_if_exists(id) {
  var existing = document.getElementById(id);
  if (existing) {
    document.body.removeChild(existing);
  }
}

function draw_rectangle(top, left, width, height, id, border, extra) {
  id || (id = 'rectangle');
  border || (border = '2px solid yellow');
  remove_if_exists(id);

  var outer = document.createElement('div');
  outer.style.position = 'absolute';
  outer.style.top = top + 'px';
  outer.style.left = left + 'px';
  outer.id = id;

  var rect = document.createElement('div');
  rect.style.border = border;
  rect.style.width = width + 'px';
  rect.style.height = height + 'px';
  outer.appendChild(rect)
  if (extra) {
    var pre = document.createElement('pre');
    pre.appendChild(document.createTextNode(extra));
    pre.style['max-width'] = '800px';
    pre.style['max-height'] = '400px';
    pre.style.overflow = 'scroll';
    pre.style['background-color'] = '#c3c3c3';
    pre.style.padding = '2em';
    outer.appendChild(pre);
  }
  document.body.appendChild(outer);
  outer.addEventListener('click', (function(box) { return function(e) {
    document.body.removeChild(box);
  }})(outer));
}

function draw_scaled_rectangle(base, reference, id, border, extra) {
  id || (id = 'rectangle');
  border || (border = '2px solid yellow');

  var scaleY = base.height / base.naturalHeight;
  var scaleX = base.width / base.naturalWidth;
  var x = base.getBoundingClientRect().x + window.pageXOffset;
  var y = base.getBoundingClientRect().y + window.pageYOffset;

  draw_rectangle(
    y + scaleY * reference.top,
    x + scaleX * reference.left, 
    scaleX * reference.width,
    scaleY * reference.height,
    id,
    border,
    extra
  );
}

function rectangle_visibility(rectangle) {
  if (rectangle.height > 1 && rectangle.width > 1) {
    return 'visible';
  }
  else {
    return 'invisible';
  }
}

function build_page_data(elements) {
  return '<h3>Elements</h3><ul>' + elements.map(function(e, idx) {
    var content = '<dt>Visibility</dt><dd>' + rectangle_visibility(e.rectangle) + '</dd>';
    content += '<dt>Path</dt><dd>' + e.path + '</dd>';
    return '<li data-index="' + idx + '"><dl class="issue">' + content + '</dl></li>';
  }).join('') + '</ul>';
}

function type_lookup(i) {
  return ['unknown', 'error', 'warning', 'notice'][i];
}

function build_analysis_data(issues) {
  return '<h3>Issues</h3>' +
    '<div class="btn-group error warning notice" data-toggle="buttons">' +
      '<label class="btn btn-danger active">' +
        '<input type="checkbox" checked autocomplete="off" name="error" value="error">Error' +
      '</label>' +
      '<label class="btn btn-warning active">' +
        '<input type="checkbox" checked autocomplete="off" name="warning" value="warning">Warning' +
      '</label>' +
      '<label class="btn btn-info active">' +
        '<input type="checkbox" checked autocomplete="off" name="notice" value="notice">Notice' +
      '</label>' +
    '</div>' +
    '<ul class="toggle">' + issues.map((function() { return function (i, idx) {
    var content = '<dt>Visibility</dt><dd>' + rectangle_visibility(i.element.rectangle) + '</dd>';
    content += '<dt>Type</dt><dd>' + type_lookup(i.type) + '</dd>';
    content += '<dt>Message</dt><dd>' + i.msg + '</dd>';
    content += '<dt>Code</dt><dd>' + i.code + '</dd>';
    content += '<dt>Path</dt><dd>' + i.element.path + '</dd>';
    return '<li data-index="' + idx + '" class="' + type_lookup(i.type) + '"><dl class="issue">' + content + '</dl></li>';
  }})()).join('') + '</ul>';
}

function find_index(p) {
  var index = null;
  while (p && ! (index = p.getAttribute('data-index'))) {
    p = p.parentElement;
  }
  return index;
}

function lookup_border(type) {
  type || (type = 0);
  return ['2px dashed yellow', '2px solid red', '2px solid orange', '2px solid yellow'][type];
}

var r = new XMLHttpRequest();
r.open("GET", "page.json", true);
r.onreadystatechange = function () {
  if (r.readyState != 4 || r.status != 200) return;

  var data = JSON.parse(r.responseText);
  var page_analysis_node = document.getElementsByClassName('page-analysis')[0];
  var page_elements_node = document.getElementsByClassName('page-elements')[0];
  var img_node = document.getElementsByTagName('img')[0];

  page_elements_node.innerHTML = build_page_data(data.elements);
  page_elements_node.getElementsByTagName('ul')[0].style.height = img_node.height + 'px';

  page_elements_node.addEventListener('click', (function (data, base) { return function (e) {
    var index = find_index(e.target);
    if (!index) return;
    var element = data[index];
    var border  = lookup_border(0);
    draw_scaled_rectangle(base, element.rectangle, 'rectangle', border, element.html);
  }})(data.elements, img_node));

  page_analysis_node.innerHTML = build_analysis_data(data.analysis.issues);
  var btn_group_node = page_analysis_node.getElementsByClassName('btn-group')[0];
  var btn_group_rect = btn_group_node.getBoundingClientRect();
  page_analysis_node.getElementsByTagName('ul')[0].style.height = (img_node.height - btn_group_rect.height) + 'px';

  btn_group_node.addEventListener('click', function(e) {
    var elt = e.target;
    if (elt.tagName == 'INPUT') {
      if (elt.checked) {
        elt.parentElement.classList.add('active');
        elt.parentElement.parentElement.classList.add(elt.getAttribute('value'));
      }
      else {
        elt.parentElement.classList.remove('active');
        elt.parentElement.parentElement.classList.remove(elt.getAttribute('value'));
      }
    }
  });

  page_analysis_node.addEventListener('click', (function (data, base) { return function (e) {
    var index = find_index(e.target);
    if (!index) return;
    var element = data[index].element;
    var border  = lookup_border(data[index].type);
    draw_scaled_rectangle(base, element.rectangle, 'rectangle', border, element.html);
  }})(data.analysis.issues, img_node));

  document.getElementById('site-value').innerHTML = data.analysis.documentTitle;
  document.getElementById('url-value').innerHTML = data.analysis.pageUrl;
};
r.send();
