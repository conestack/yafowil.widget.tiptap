var tiptap = (function (exports) {
  'use strict';

  function OrderedMap(content) {
    this.content = content;
  }
  OrderedMap.prototype = {
    constructor: OrderedMap,
    find: function(key) {
      for (var i = 0; i < this.content.length; i += 2)
        if (this.content[i] === key) return i
      return -1
    },
    get: function(key) {
      var found = this.find(key);
      return found == -1 ? undefined : this.content[found + 1]
    },
    update: function(key, value, newKey) {
      var self = newKey && newKey != key ? this.remove(newKey) : this;
      var found = self.find(key), content = self.content.slice();
      if (found == -1) {
        content.push(newKey || key, value);
      } else {
        content[found + 1] = value;
        if (newKey) content[found] = newKey;
      }
      return new OrderedMap(content)
    },
    remove: function(key) {
      var found = this.find(key);
      if (found == -1) return this
      var content = this.content.slice();
      content.splice(found, 2);
      return new OrderedMap(content)
    },
    addToStart: function(key, value) {
      return new OrderedMap([key, value].concat(this.remove(key).content))
    },
    addToEnd: function(key, value) {
      var content = this.remove(key).content.slice();
      content.push(key, value);
      return new OrderedMap(content)
    },
    addBefore: function(place, key, value) {
      var without = this.remove(key), content = without.content.slice();
      var found = without.find(place);
      content.splice(found == -1 ? content.length : found, 0, key, value);
      return new OrderedMap(content)
    },
    forEach: function(f) {
      for (var i = 0; i < this.content.length; i += 2)
        f(this.content[i], this.content[i + 1]);
    },
    prepend: function(map) {
      map = OrderedMap.from(map);
      if (!map.size) return this
      return new OrderedMap(map.content.concat(this.subtract(map).content))
    },
    append: function(map) {
      map = OrderedMap.from(map);
      if (!map.size) return this
      return new OrderedMap(this.subtract(map).content.concat(map.content))
    },
    subtract: function(map) {
      var result = this;
      map = OrderedMap.from(map);
      for (var i = 0; i < map.content.length; i += 2)
        result = result.remove(map.content[i]);
      return result
    },
    get size() {
      return this.content.length >> 1
    }
  };
  OrderedMap.from = function(value) {
    if (value instanceof OrderedMap) return value
    var content = [];
    if (value) for (var prop in value) content.push(prop, value[prop]);
    return new OrderedMap(content)
  };
  var orderedmap = OrderedMap;

  function findDiffStart(a, b, pos) {
    for (var i = 0;; i++) {
      if (i == a.childCount || i == b.childCount)
        { return a.childCount == b.childCount ? null : pos }
      var childA = a.child(i), childB = b.child(i);
      if (childA == childB) { pos += childA.nodeSize; continue }
      if (!childA.sameMarkup(childB)) { return pos }
      if (childA.isText && childA.text != childB.text) {
        for (var j = 0; childA.text[j] == childB.text[j]; j++)
          { pos++; }
        return pos
      }
      if (childA.content.size || childB.content.size) {
        var inner = findDiffStart(childA.content, childB.content, pos + 1);
        if (inner != null) { return inner }
      }
      pos += childA.nodeSize;
    }
  }
  function findDiffEnd(a, b, posA, posB) {
    for (var iA = a.childCount, iB = b.childCount;;) {
      if (iA == 0 || iB == 0)
        { return iA == iB ? null : {a: posA, b: posB} }
      var childA = a.child(--iA), childB = b.child(--iB), size = childA.nodeSize;
      if (childA == childB) {
        posA -= size; posB -= size;
        continue
      }
      if (!childA.sameMarkup(childB)) { return {a: posA, b: posB} }
      if (childA.isText && childA.text != childB.text) {
        var same = 0, minSize = Math.min(childA.text.length, childB.text.length);
        while (same < minSize && childA.text[childA.text.length - same - 1] == childB.text[childB.text.length - same - 1]) {
          same++; posA--; posB--;
        }
        return {a: posA, b: posB}
      }
      if (childA.content.size || childB.content.size) {
        var inner = findDiffEnd(childA.content, childB.content, posA - 1, posB - 1);
        if (inner) { return inner }
      }
      posA -= size; posB -= size;
    }
  }
  var Fragment = function Fragment(content, size) {
    this.content = content;
    this.size = size || 0;
    if (size == null) { for (var i = 0; i < content.length; i++)
      { this.size += content[i].nodeSize; } }
  };
  var prototypeAccessors$5 = { firstChild: { configurable: true },lastChild: { configurable: true },childCount: { configurable: true } };
  Fragment.prototype.nodesBetween = function nodesBetween (from, to, f, nodeStart, parent) {
      if ( nodeStart === void 0 ) nodeStart = 0;
    for (var i = 0, pos = 0; pos < to; i++) {
      var child = this.content[i], end = pos + child.nodeSize;
      if (end > from && f(child, nodeStart + pos, parent, i) !== false && child.content.size) {
        var start = pos + 1;
        child.nodesBetween(Math.max(0, from - start),
                           Math.min(child.content.size, to - start),
                           f, nodeStart + start);
      }
      pos = end;
    }
  };
  Fragment.prototype.descendants = function descendants (f) {
    this.nodesBetween(0, this.size, f);
  };
  Fragment.prototype.textBetween = function textBetween (from, to, blockSeparator, leafText) {
    var text = "", separated = true;
    this.nodesBetween(from, to, function (node, pos) {
      if (node.isText) {
        text += node.text.slice(Math.max(from, pos) - pos, to - pos);
        separated = !blockSeparator;
      } else if (node.isLeaf && leafText) {
        text += typeof leafText === 'function' ? leafText(node): leafText;
        separated = !blockSeparator;
      } else if (!separated && node.isBlock) {
        text += blockSeparator;
        separated = true;
      }
    }, 0);
    return text
  };
  Fragment.prototype.append = function append (other) {
    if (!other.size) { return this }
    if (!this.size) { return other }
    var last = this.lastChild, first = other.firstChild, content = this.content.slice(), i = 0;
    if (last.isText && last.sameMarkup(first)) {
      content[content.length - 1] = last.withText(last.text + first.text);
      i = 1;
    }
    for (; i < other.content.length; i++) { content.push(other.content[i]); }
    return new Fragment(content, this.size + other.size)
  };
  Fragment.prototype.cut = function cut (from, to) {
    if (to == null) { to = this.size; }
    if (from == 0 && to == this.size) { return this }
    var result = [], size = 0;
    if (to > from) { for (var i = 0, pos = 0; pos < to; i++) {
      var child = this.content[i], end = pos + child.nodeSize;
      if (end > from) {
        if (pos < from || end > to) {
          if (child.isText)
            { child = child.cut(Math.max(0, from - pos), Math.min(child.text.length, to - pos)); }
          else
            { child = child.cut(Math.max(0, from - pos - 1), Math.min(child.content.size, to - pos - 1)); }
        }
        result.push(child);
        size += child.nodeSize;
      }
      pos = end;
    } }
    return new Fragment(result, size)
  };
  Fragment.prototype.cutByIndex = function cutByIndex (from, to) {
    if (from == to) { return Fragment.empty }
    if (from == 0 && to == this.content.length) { return this }
    return new Fragment(this.content.slice(from, to))
  };
  Fragment.prototype.replaceChild = function replaceChild (index, node) {
    var current = this.content[index];
    if (current == node) { return this }
    var copy = this.content.slice();
    var size = this.size + node.nodeSize - current.nodeSize;
    copy[index] = node;
    return new Fragment(copy, size)
  };
  Fragment.prototype.addToStart = function addToStart (node) {
    return new Fragment([node].concat(this.content), this.size + node.nodeSize)
  };
  Fragment.prototype.addToEnd = function addToEnd (node) {
    return new Fragment(this.content.concat(node), this.size + node.nodeSize)
  };
  Fragment.prototype.eq = function eq (other) {
    if (this.content.length != other.content.length) { return false }
    for (var i = 0; i < this.content.length; i++)
      { if (!this.content[i].eq(other.content[i])) { return false } }
    return true
  };
  prototypeAccessors$5.firstChild.get = function () { return this.content.length ? this.content[0] : null };
  prototypeAccessors$5.lastChild.get = function () { return this.content.length ? this.content[this.content.length - 1] : null };
  prototypeAccessors$5.childCount.get = function () { return this.content.length };
  Fragment.prototype.child = function child (index) {
    var found = this.content[index];
    if (!found) { throw new RangeError("Index " + index + " out of range for " + this) }
    return found
  };
  Fragment.prototype.maybeChild = function maybeChild (index) {
    return this.content[index]
  };
  Fragment.prototype.forEach = function forEach (f) {
    for (var i = 0, p = 0; i < this.content.length; i++) {
      var child = this.content[i];
      f(child, p, i);
      p += child.nodeSize;
    }
  };
  Fragment.prototype.findDiffStart = function findDiffStart$1 (other, pos) {
      if ( pos === void 0 ) pos = 0;
    return findDiffStart(this, other, pos)
  };
  Fragment.prototype.findDiffEnd = function findDiffEnd$1 (other, pos, otherPos) {
      if ( pos === void 0 ) pos = this.size;
      if ( otherPos === void 0 ) otherPos = other.size;
    return findDiffEnd(this, other, pos, otherPos)
  };
  Fragment.prototype.findIndex = function findIndex (pos, round) {
      if ( round === void 0 ) round = -1;
    if (pos == 0) { return retIndex(0, pos) }
    if (pos == this.size) { return retIndex(this.content.length, pos) }
    if (pos > this.size || pos < 0) { throw new RangeError(("Position " + pos + " outside of fragment (" + (this) + ")")) }
    for (var i = 0, curPos = 0;; i++) {
      var cur = this.child(i), end = curPos + cur.nodeSize;
      if (end >= pos) {
        if (end == pos || round > 0) { return retIndex(i + 1, end) }
        return retIndex(i, curPos)
      }
      curPos = end;
    }
  };
  Fragment.prototype.toString = function toString () { return "<" + this.toStringInner() + ">" };
  Fragment.prototype.toStringInner = function toStringInner () { return this.content.join(", ") };
  Fragment.prototype.toJSON = function toJSON () {
    return this.content.length ? this.content.map(function (n) { return n.toJSON(); }) : null
  };
  Fragment.fromJSON = function fromJSON (schema, value) {
    if (!value) { return Fragment.empty }
    if (!Array.isArray(value)) { throw new RangeError("Invalid input for Fragment.fromJSON") }
    return new Fragment(value.map(schema.nodeFromJSON))
  };
  Fragment.fromArray = function fromArray (array) {
    if (!array.length) { return Fragment.empty }
    var joined, size = 0;
    for (var i = 0; i < array.length; i++) {
      var node = array[i];
      size += node.nodeSize;
      if (i && node.isText && array[i - 1].sameMarkup(node)) {
        if (!joined) { joined = array.slice(0, i); }
        joined[joined.length - 1] = node.withText(joined[joined.length - 1].text + node.text);
      } else if (joined) {
        joined.push(node);
      }
    }
    return new Fragment(joined || array, size)
  };
  Fragment.from = function from (nodes) {
    if (!nodes) { return Fragment.empty }
    if (nodes instanceof Fragment) { return nodes }
    if (Array.isArray(nodes)) { return this.fromArray(nodes) }
    if (nodes.attrs) { return new Fragment([nodes], nodes.nodeSize) }
    throw new RangeError("Can not convert " + nodes + " to a Fragment" +
                         (nodes.nodesBetween ? " (looks like multiple versions of prosemirror-model were loaded)" : ""))
  };
  Object.defineProperties( Fragment.prototype, prototypeAccessors$5 );
  var found = {index: 0, offset: 0};
  function retIndex(index, offset) {
    found.index = index;
    found.offset = offset;
    return found
  }
  Fragment.empty = new Fragment([], 0);
  function compareDeep(a, b) {
    if (a === b) { return true }
    if (!(a && typeof a == "object") ||
        !(b && typeof b == "object")) { return false }
    var array = Array.isArray(a);
    if (Array.isArray(b) != array) { return false }
    if (array) {
      if (a.length != b.length) { return false }
      for (var i = 0; i < a.length; i++) { if (!compareDeep(a[i], b[i])) { return false } }
    } else {
      for (var p in a) { if (!(p in b) || !compareDeep(a[p], b[p])) { return false } }
      for (var p$1 in b) { if (!(p$1 in a)) { return false } }
    }
    return true
  }
  var Mark$1 = function Mark(type, attrs) {
    this.type = type;
    this.attrs = attrs;
  };
  Mark$1.prototype.addToSet = function addToSet (set) {
    var copy, placed = false;
    for (var i = 0; i < set.length; i++) {
      var other = set[i];
      if (this.eq(other)) { return set }
      if (this.type.excludes(other.type)) {
        if (!copy) { copy = set.slice(0, i); }
      } else if (other.type.excludes(this.type)) {
        return set
      } else {
        if (!placed && other.type.rank > this.type.rank) {
          if (!copy) { copy = set.slice(0, i); }
          copy.push(this);
          placed = true;
        }
        if (copy) { copy.push(other); }
      }
    }
    if (!copy) { copy = set.slice(); }
    if (!placed) { copy.push(this); }
    return copy
  };
  Mark$1.prototype.removeFromSet = function removeFromSet (set) {
    for (var i = 0; i < set.length; i++)
      { if (this.eq(set[i]))
        { return set.slice(0, i).concat(set.slice(i + 1)) } }
    return set
  };
  Mark$1.prototype.isInSet = function isInSet (set) {
    for (var i = 0; i < set.length; i++)
      { if (this.eq(set[i])) { return true } }
    return false
  };
  Mark$1.prototype.eq = function eq (other) {
    return this == other ||
      (this.type == other.type && compareDeep(this.attrs, other.attrs))
  };
  Mark$1.prototype.toJSON = function toJSON () {
    var obj = {type: this.type.name};
    for (var _ in this.attrs) {
      obj.attrs = this.attrs;
      break
    }
    return obj
  };
  Mark$1.fromJSON = function fromJSON (schema, json) {
    if (!json) { throw new RangeError("Invalid input for Mark.fromJSON") }
    var type = schema.marks[json.type];
    if (!type) { throw new RangeError(("There is no mark type " + (json.type) + " in this schema")) }
    return type.create(json.attrs)
  };
  Mark$1.sameSet = function sameSet (a, b) {
    if (a == b) { return true }
    if (a.length != b.length) { return false }
    for (var i = 0; i < a.length; i++)
      { if (!a[i].eq(b[i])) { return false } }
    return true
  };
  Mark$1.setFrom = function setFrom (marks) {
    if (!marks || marks.length == 0) { return Mark$1.none }
    if (marks instanceof Mark$1) { return [marks] }
    var copy = marks.slice();
    copy.sort(function (a, b) { return a.type.rank - b.type.rank; });
    return copy
  };
  Mark$1.none = [];
  function ReplaceError(message) {
    var err = Error.call(this, message);
    err.__proto__ = ReplaceError.prototype;
    return err
  }
  ReplaceError.prototype = Object.create(Error.prototype);
  ReplaceError.prototype.constructor = ReplaceError;
  ReplaceError.prototype.name = "ReplaceError";
  var Slice = function Slice(content, openStart, openEnd) {
    this.content = content;
    this.openStart = openStart;
    this.openEnd = openEnd;
  };
  var prototypeAccessors$1$3 = { size: { configurable: true } };
  prototypeAccessors$1$3.size.get = function () {
    return this.content.size - this.openStart - this.openEnd
  };
  Slice.prototype.insertAt = function insertAt (pos, fragment) {
    var content = insertInto(this.content, pos + this.openStart, fragment, null);
    return content && new Slice(content, this.openStart, this.openEnd)
  };
  Slice.prototype.removeBetween = function removeBetween (from, to) {
    return new Slice(removeRange(this.content, from + this.openStart, to + this.openStart), this.openStart, this.openEnd)
  };
  Slice.prototype.eq = function eq (other) {
    return this.content.eq(other.content) && this.openStart == other.openStart && this.openEnd == other.openEnd
  };
  Slice.prototype.toString = function toString () {
    return this.content + "(" + this.openStart + "," + this.openEnd + ")"
  };
  Slice.prototype.toJSON = function toJSON () {
    if (!this.content.size) { return null }
    var json = {content: this.content.toJSON()};
    if (this.openStart > 0) { json.openStart = this.openStart; }
    if (this.openEnd > 0) { json.openEnd = this.openEnd; }
    return json
  };
  Slice.fromJSON = function fromJSON (schema, json) {
    if (!json) { return Slice.empty }
    var openStart = json.openStart || 0, openEnd = json.openEnd || 0;
    if (typeof openStart != "number" || typeof openEnd != "number")
      { throw new RangeError("Invalid input for Slice.fromJSON") }
    return new Slice(Fragment.fromJSON(schema, json.content), openStart, openEnd)
  };
  Slice.maxOpen = function maxOpen (fragment, openIsolating) {
      if ( openIsolating === void 0 ) openIsolating=true;
    var openStart = 0, openEnd = 0;
    for (var n = fragment.firstChild; n && !n.isLeaf && (openIsolating || !n.type.spec.isolating); n = n.firstChild) { openStart++; }
    for (var n$1 = fragment.lastChild; n$1 && !n$1.isLeaf && (openIsolating || !n$1.type.spec.isolating); n$1 = n$1.lastChild) { openEnd++; }
    return new Slice(fragment, openStart, openEnd)
  };
  Object.defineProperties( Slice.prototype, prototypeAccessors$1$3 );
  function removeRange(content, from, to) {
    var ref = content.findIndex(from);
    var index = ref.index;
    var offset = ref.offset;
    var child = content.maybeChild(index);
    var ref$1 = content.findIndex(to);
    var indexTo = ref$1.index;
    var offsetTo = ref$1.offset;
    if (offset == from || child.isText) {
      if (offsetTo != to && !content.child(indexTo).isText) { throw new RangeError("Removing non-flat range") }
      return content.cut(0, from).append(content.cut(to))
    }
    if (index != indexTo) { throw new RangeError("Removing non-flat range") }
    return content.replaceChild(index, child.copy(removeRange(child.content, from - offset - 1, to - offset - 1)))
  }
  function insertInto(content, dist, insert, parent) {
    var ref = content.findIndex(dist);
    var index = ref.index;
    var offset = ref.offset;
    var child = content.maybeChild(index);
    if (offset == dist || child.isText) {
      if (parent && !parent.canReplace(index, index, insert)) { return null }
      return content.cut(0, dist).append(insert).append(content.cut(dist))
    }
    var inner = insertInto(child.content, dist - offset - 1, insert);
    return inner && content.replaceChild(index, child.copy(inner))
  }
  Slice.empty = new Slice(Fragment.empty, 0, 0);
  function replace($from, $to, slice) {
    if (slice.openStart > $from.depth)
      { throw new ReplaceError("Inserted content deeper than insertion position") }
    if ($from.depth - slice.openStart != $to.depth - slice.openEnd)
      { throw new ReplaceError("Inconsistent open depths") }
    return replaceOuter($from, $to, slice, 0)
  }
  function replaceOuter($from, $to, slice, depth) {
    var index = $from.index(depth), node = $from.node(depth);
    if (index == $to.index(depth) && depth < $from.depth - slice.openStart) {
      var inner = replaceOuter($from, $to, slice, depth + 1);
      return node.copy(node.content.replaceChild(index, inner))
    } else if (!slice.content.size) {
      return close(node, replaceTwoWay($from, $to, depth))
    } else if (!slice.openStart && !slice.openEnd && $from.depth == depth && $to.depth == depth) {
      var parent = $from.parent, content = parent.content;
      return close(parent, content.cut(0, $from.parentOffset).append(slice.content).append(content.cut($to.parentOffset)))
    } else {
      var ref = prepareSliceForReplace(slice, $from);
      var start = ref.start;
      var end = ref.end;
      return close(node, replaceThreeWay($from, start, end, $to, depth))
    }
  }
  function checkJoin(main, sub) {
    if (!sub.type.compatibleContent(main.type))
      { throw new ReplaceError("Cannot join " + sub.type.name + " onto " + main.type.name) }
  }
  function joinable$1($before, $after, depth) {
    var node = $before.node(depth);
    checkJoin(node, $after.node(depth));
    return node
  }
  function addNode(child, target) {
    var last = target.length - 1;
    if (last >= 0 && child.isText && child.sameMarkup(target[last]))
      { target[last] = child.withText(target[last].text + child.text); }
    else
      { target.push(child); }
  }
  function addRange($start, $end, depth, target) {
    var node = ($end || $start).node(depth);
    var startIndex = 0, endIndex = $end ? $end.index(depth) : node.childCount;
    if ($start) {
      startIndex = $start.index(depth);
      if ($start.depth > depth) {
        startIndex++;
      } else if ($start.textOffset) {
        addNode($start.nodeAfter, target);
        startIndex++;
      }
    }
    for (var i = startIndex; i < endIndex; i++) { addNode(node.child(i), target); }
    if ($end && $end.depth == depth && $end.textOffset)
      { addNode($end.nodeBefore, target); }
  }
  function close(node, content) {
    if (!node.type.validContent(content))
      { throw new ReplaceError("Invalid content for node " + node.type.name) }
    return node.copy(content)
  }
  function replaceThreeWay($from, $start, $end, $to, depth) {
    var openStart = $from.depth > depth && joinable$1($from, $start, depth + 1);
    var openEnd = $to.depth > depth && joinable$1($end, $to, depth + 1);
    var content = [];
    addRange(null, $from, depth, content);
    if (openStart && openEnd && $start.index(depth) == $end.index(depth)) {
      checkJoin(openStart, openEnd);
      addNode(close(openStart, replaceThreeWay($from, $start, $end, $to, depth + 1)), content);
    } else {
      if (openStart)
        { addNode(close(openStart, replaceTwoWay($from, $start, depth + 1)), content); }
      addRange($start, $end, depth, content);
      if (openEnd)
        { addNode(close(openEnd, replaceTwoWay($end, $to, depth + 1)), content); }
    }
    addRange($to, null, depth, content);
    return new Fragment(content)
  }
  function replaceTwoWay($from, $to, depth) {
    var content = [];
    addRange(null, $from, depth, content);
    if ($from.depth > depth) {
      var type = joinable$1($from, $to, depth + 1);
      addNode(close(type, replaceTwoWay($from, $to, depth + 1)), content);
    }
    addRange($to, null, depth, content);
    return new Fragment(content)
  }
  function prepareSliceForReplace(slice, $along) {
    var extra = $along.depth - slice.openStart, parent = $along.node(extra);
    var node = parent.copy(slice.content);
    for (var i = extra - 1; i >= 0; i--)
      { node = $along.node(i).copy(Fragment.from(node)); }
    return {start: node.resolveNoCache(slice.openStart + extra),
            end: node.resolveNoCache(node.content.size - slice.openEnd - extra)}
  }
  var ResolvedPos = function ResolvedPos(pos, path, parentOffset) {
    this.pos = pos;
    this.path = path;
    this.depth = path.length / 3 - 1;
    this.parentOffset = parentOffset;
  };
  var prototypeAccessors$2$1 = { parent: { configurable: true },doc: { configurable: true },textOffset: { configurable: true },nodeAfter: { configurable: true },nodeBefore: { configurable: true } };
  ResolvedPos.prototype.resolveDepth = function resolveDepth (val) {
    if (val == null) { return this.depth }
    if (val < 0) { return this.depth + val }
    return val
  };
  prototypeAccessors$2$1.parent.get = function () { return this.node(this.depth) };
  prototypeAccessors$2$1.doc.get = function () { return this.node(0) };
  ResolvedPos.prototype.node = function node (depth) { return this.path[this.resolveDepth(depth) * 3] };
  ResolvedPos.prototype.index = function index (depth) { return this.path[this.resolveDepth(depth) * 3 + 1] };
  ResolvedPos.prototype.indexAfter = function indexAfter (depth) {
    depth = this.resolveDepth(depth);
    return this.index(depth) + (depth == this.depth && !this.textOffset ? 0 : 1)
  };
  ResolvedPos.prototype.start = function start (depth) {
    depth = this.resolveDepth(depth);
    return depth == 0 ? 0 : this.path[depth * 3 - 1] + 1
  };
  ResolvedPos.prototype.end = function end (depth) {
    depth = this.resolveDepth(depth);
    return this.start(depth) + this.node(depth).content.size
  };
  ResolvedPos.prototype.before = function before (depth) {
    depth = this.resolveDepth(depth);
    if (!depth) { throw new RangeError("There is no position before the top-level node") }
    return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1]
  };
  ResolvedPos.prototype.after = function after (depth) {
    depth = this.resolveDepth(depth);
    if (!depth) { throw new RangeError("There is no position after the top-level node") }
    return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1] + this.path[depth * 3].nodeSize
  };
  prototypeAccessors$2$1.textOffset.get = function () { return this.pos - this.path[this.path.length - 1] };
  prototypeAccessors$2$1.nodeAfter.get = function () {
    var parent = this.parent, index = this.index(this.depth);
    if (index == parent.childCount) { return null }
    var dOff = this.pos - this.path[this.path.length - 1], child = parent.child(index);
    return dOff ? parent.child(index).cut(dOff) : child
  };
  prototypeAccessors$2$1.nodeBefore.get = function () {
    var index = this.index(this.depth);
    var dOff = this.pos - this.path[this.path.length - 1];
    if (dOff) { return this.parent.child(index).cut(0, dOff) }
    return index == 0 ? null : this.parent.child(index - 1)
  };
  ResolvedPos.prototype.posAtIndex = function posAtIndex (index, depth) {
    depth = this.resolveDepth(depth);
    var node = this.path[depth * 3], pos = depth == 0 ? 0 : this.path[depth * 3 - 1] + 1;
    for (var i = 0; i < index; i++) { pos += node.child(i).nodeSize; }
    return pos
  };
  ResolvedPos.prototype.marks = function marks () {
    var parent = this.parent, index = this.index();
    if (parent.content.size == 0) { return Mark$1.none }
    if (this.textOffset) { return parent.child(index).marks }
    var main = parent.maybeChild(index - 1), other = parent.maybeChild(index);
    if (!main) { var tmp = main; main = other; other = tmp; }
    var marks = main.marks;
    for (var i = 0; i < marks.length; i++)
      { if (marks[i].type.spec.inclusive === false && (!other || !marks[i].isInSet(other.marks)))
        { marks = marks[i--].removeFromSet(marks); } }
    return marks
  };
  ResolvedPos.prototype.marksAcross = function marksAcross ($end) {
    var after = this.parent.maybeChild(this.index());
    if (!after || !after.isInline) { return null }
    var marks = after.marks, next = $end.parent.maybeChild($end.index());
    for (var i = 0; i < marks.length; i++)
      { if (marks[i].type.spec.inclusive === false && (!next || !marks[i].isInSet(next.marks)))
        { marks = marks[i--].removeFromSet(marks); } }
    return marks
  };
  ResolvedPos.prototype.sharedDepth = function sharedDepth (pos) {
    for (var depth = this.depth; depth > 0; depth--)
      { if (this.start(depth) <= pos && this.end(depth) >= pos) { return depth } }
    return 0
  };
  ResolvedPos.prototype.blockRange = function blockRange (other, pred) {
      if ( other === void 0 ) other = this;
    if (other.pos < this.pos) { return other.blockRange(this) }
    for (var d = this.depth - (this.parent.inlineContent || this.pos == other.pos ? 1 : 0); d >= 0; d--)
      { if (other.pos <= this.end(d) && (!pred || pred(this.node(d))))
        { return new NodeRange(this, other, d) } }
  };
  ResolvedPos.prototype.sameParent = function sameParent (other) {
    return this.pos - this.parentOffset == other.pos - other.parentOffset
  };
  ResolvedPos.prototype.max = function max (other) {
    return other.pos > this.pos ? other : this
  };
  ResolvedPos.prototype.min = function min (other) {
    return other.pos < this.pos ? other : this
  };
  ResolvedPos.prototype.toString = function toString () {
    var str = "";
    for (var i = 1; i <= this.depth; i++)
      { str += (str ? "/" : "") + this.node(i).type.name + "_" + this.index(i - 1); }
    return str + ":" + this.parentOffset
  };
  ResolvedPos.resolve = function resolve (doc, pos) {
    if (!(pos >= 0 && pos <= doc.content.size)) { throw new RangeError("Position " + pos + " out of range") }
    var path = [];
    var start = 0, parentOffset = pos;
    for (var node = doc;;) {
      var ref = node.content.findIndex(parentOffset);
        var index = ref.index;
        var offset = ref.offset;
      var rem = parentOffset - offset;
      path.push(node, index, start + offset);
      if (!rem) { break }
      node = node.child(index);
      if (node.isText) { break }
      parentOffset = rem - 1;
      start += offset + 1;
    }
    return new ResolvedPos(pos, path, parentOffset)
  };
  ResolvedPos.resolveCached = function resolveCached (doc, pos) {
    for (var i = 0; i < resolveCache.length; i++) {
      var cached = resolveCache[i];
      if (cached.pos == pos && cached.doc == doc) { return cached }
    }
    var result = resolveCache[resolveCachePos] = ResolvedPos.resolve(doc, pos);
    resolveCachePos = (resolveCachePos + 1) % resolveCacheSize;
    return result
  };
  Object.defineProperties( ResolvedPos.prototype, prototypeAccessors$2$1 );
  var resolveCache = [], resolveCachePos = 0, resolveCacheSize = 12;
  var NodeRange = function NodeRange($from, $to, depth) {
    this.$from = $from;
    this.$to = $to;
    this.depth = depth;
  };
  var prototypeAccessors$1$1$1 = { start: { configurable: true },end: { configurable: true },parent: { configurable: true },startIndex: { configurable: true },endIndex: { configurable: true } };
  prototypeAccessors$1$1$1.start.get = function () { return this.$from.before(this.depth + 1) };
  prototypeAccessors$1$1$1.end.get = function () { return this.$to.after(this.depth + 1) };
  prototypeAccessors$1$1$1.parent.get = function () { return this.$from.node(this.depth) };
  prototypeAccessors$1$1$1.startIndex.get = function () { return this.$from.index(this.depth) };
  prototypeAccessors$1$1$1.endIndex.get = function () { return this.$to.indexAfter(this.depth) };
  Object.defineProperties( NodeRange.prototype, prototypeAccessors$1$1$1 );
  var emptyAttrs = Object.create(null);
  var Node$1 = function Node(type, attrs, content, marks) {
    this.type = type;
    this.attrs = attrs;
    this.content = content || Fragment.empty;
    this.marks = marks || Mark$1.none;
  };
  var prototypeAccessors$3$1 = { nodeSize: { configurable: true },childCount: { configurable: true },textContent: { configurable: true },firstChild: { configurable: true },lastChild: { configurable: true },isBlock: { configurable: true },isTextblock: { configurable: true },inlineContent: { configurable: true },isInline: { configurable: true },isText: { configurable: true },isLeaf: { configurable: true },isAtom: { configurable: true } };
  prototypeAccessors$3$1.nodeSize.get = function () { return this.isLeaf ? 1 : 2 + this.content.size };
  prototypeAccessors$3$1.childCount.get = function () { return this.content.childCount };
  Node$1.prototype.child = function child (index) { return this.content.child(index) };
  Node$1.prototype.maybeChild = function maybeChild (index) { return this.content.maybeChild(index) };
  Node$1.prototype.forEach = function forEach (f) { this.content.forEach(f); };
  Node$1.prototype.nodesBetween = function nodesBetween (from, to, f, startPos) {
      if ( startPos === void 0 ) startPos = 0;
    this.content.nodesBetween(from, to, f, startPos, this);
  };
  Node$1.prototype.descendants = function descendants (f) {
    this.nodesBetween(0, this.content.size, f);
  };
  prototypeAccessors$3$1.textContent.get = function () { return this.textBetween(0, this.content.size, "") };
  Node$1.prototype.textBetween = function textBetween (from, to, blockSeparator, leafText) {
    return this.content.textBetween(from, to, blockSeparator, leafText)
  };
  prototypeAccessors$3$1.firstChild.get = function () { return this.content.firstChild };
  prototypeAccessors$3$1.lastChild.get = function () { return this.content.lastChild };
  Node$1.prototype.eq = function eq (other) {
    return this == other || (this.sameMarkup(other) && this.content.eq(other.content))
  };
  Node$1.prototype.sameMarkup = function sameMarkup (other) {
    return this.hasMarkup(other.type, other.attrs, other.marks)
  };
  Node$1.prototype.hasMarkup = function hasMarkup (type, attrs, marks) {
    return this.type == type &&
      compareDeep(this.attrs, attrs || type.defaultAttrs || emptyAttrs) &&
      Mark$1.sameSet(this.marks, marks || Mark$1.none)
  };
  Node$1.prototype.copy = function copy (content) {
      if ( content === void 0 ) content = null;
    if (content == this.content) { return this }
    return new this.constructor(this.type, this.attrs, content, this.marks)
  };
  Node$1.prototype.mark = function mark (marks) {
    return marks == this.marks ? this : new this.constructor(this.type, this.attrs, this.content, marks)
  };
  Node$1.prototype.cut = function cut (from, to) {
    if (from == 0 && to == this.content.size) { return this }
    return this.copy(this.content.cut(from, to))
  };
  Node$1.prototype.slice = function slice (from, to, includeParents) {
      if ( to === void 0 ) to = this.content.size;
      if ( includeParents === void 0 ) includeParents = false;
    if (from == to) { return Slice.empty }
    var $from = this.resolve(from), $to = this.resolve(to);
    var depth = includeParents ? 0 : $from.sharedDepth(to);
    var start = $from.start(depth), node = $from.node(depth);
    var content = node.content.cut($from.pos - start, $to.pos - start);
    return new Slice(content, $from.depth - depth, $to.depth - depth)
  };
  Node$1.prototype.replace = function replace$1 (from, to, slice) {
    return replace(this.resolve(from), this.resolve(to), slice)
  };
  Node$1.prototype.nodeAt = function nodeAt (pos) {
    for (var node = this;;) {
      var ref = node.content.findIndex(pos);
        var index = ref.index;
        var offset = ref.offset;
      node = node.maybeChild(index);
      if (!node) { return null }
      if (offset == pos || node.isText) { return node }
      pos -= offset + 1;
    }
  };
  Node$1.prototype.childAfter = function childAfter (pos) {
    var ref = this.content.findIndex(pos);
      var index = ref.index;
      var offset = ref.offset;
    return {node: this.content.maybeChild(index), index: index, offset: offset}
  };
  Node$1.prototype.childBefore = function childBefore (pos) {
    if (pos == 0) { return {node: null, index: 0, offset: 0} }
    var ref = this.content.findIndex(pos);
      var index = ref.index;
      var offset = ref.offset;
    if (offset < pos) { return {node: this.content.child(index), index: index, offset: offset} }
    var node = this.content.child(index - 1);
    return {node: node, index: index - 1, offset: offset - node.nodeSize}
  };
  Node$1.prototype.resolve = function resolve (pos) { return ResolvedPos.resolveCached(this, pos) };
  Node$1.prototype.resolveNoCache = function resolveNoCache (pos) { return ResolvedPos.resolve(this, pos) };
  Node$1.prototype.rangeHasMark = function rangeHasMark (from, to, type) {
    var found = false;
    if (to > from) { this.nodesBetween(from, to, function (node) {
      if (type.isInSet(node.marks)) { found = true; }
      return !found
    }); }
    return found
  };
  prototypeAccessors$3$1.isBlock.get = function () { return this.type.isBlock };
  prototypeAccessors$3$1.isTextblock.get = function () { return this.type.isTextblock };
  prototypeAccessors$3$1.inlineContent.get = function () { return this.type.inlineContent };
  prototypeAccessors$3$1.isInline.get = function () { return this.type.isInline };
  prototypeAccessors$3$1.isText.get = function () { return this.type.isText };
  prototypeAccessors$3$1.isLeaf.get = function () { return this.type.isLeaf };
  prototypeAccessors$3$1.isAtom.get = function () { return this.type.isAtom };
  Node$1.prototype.toString = function toString () {
    if (this.type.spec.toDebugString) { return this.type.spec.toDebugString(this) }
    var name = this.type.name;
    if (this.content.size)
      { name += "(" + this.content.toStringInner() + ")"; }
    return wrapMarks(this.marks, name)
  };
  Node$1.prototype.contentMatchAt = function contentMatchAt (index) {
    var match = this.type.contentMatch.matchFragment(this.content, 0, index);
    if (!match) { throw new Error("Called contentMatchAt on a node with invalid content") }
    return match
  };
  Node$1.prototype.canReplace = function canReplace (from, to, replacement, start, end) {
      if ( replacement === void 0 ) replacement = Fragment.empty;
      if ( start === void 0 ) start = 0;
      if ( end === void 0 ) end = replacement.childCount;
    var one = this.contentMatchAt(from).matchFragment(replacement, start, end);
    var two = one && one.matchFragment(this.content, to);
    if (!two || !two.validEnd) { return false }
    for (var i = start; i < end; i++) { if (!this.type.allowsMarks(replacement.child(i).marks)) { return false } }
    return true
  };
  Node$1.prototype.canReplaceWith = function canReplaceWith (from, to, type, marks) {
    if (marks && !this.type.allowsMarks(marks)) { return false }
    var start = this.contentMatchAt(from).matchType(type);
    var end = start && start.matchFragment(this.content, to);
    return end ? end.validEnd : false
  };
  Node$1.prototype.canAppend = function canAppend (other) {
    if (other.content.size) { return this.canReplace(this.childCount, this.childCount, other.content) }
    else { return this.type.compatibleContent(other.type) }
  };
  Node$1.prototype.check = function check () {
    if (!this.type.validContent(this.content))
      { throw new RangeError(("Invalid content for node " + (this.type.name) + ": " + (this.content.toString().slice(0, 50)))) }
    var copy = Mark$1.none;
    for (var i = 0; i < this.marks.length; i++) { copy = this.marks[i].addToSet(copy); }
    if (!Mark$1.sameSet(copy, this.marks))
      { throw new RangeError(("Invalid collection of marks for node " + (this.type.name) + ": " + (this.marks.map(function (m) { return m.type.name; })))) }
    this.content.forEach(function (node) { return node.check(); });
  };
  Node$1.prototype.toJSON = function toJSON () {
    var obj = {type: this.type.name};
    for (var _ in this.attrs) {
      obj.attrs = this.attrs;
      break
    }
    if (this.content.size)
      { obj.content = this.content.toJSON(); }
    if (this.marks.length)
      { obj.marks = this.marks.map(function (n) { return n.toJSON(); }); }
    return obj
  };
  Node$1.fromJSON = function fromJSON (schema, json) {
    if (!json) { throw new RangeError("Invalid input for Node.fromJSON") }
    var marks = null;
    if (json.marks) {
      if (!Array.isArray(json.marks)) { throw new RangeError("Invalid mark data for Node.fromJSON") }
      marks = json.marks.map(schema.markFromJSON);
    }
    if (json.type == "text") {
      if (typeof json.text != "string") { throw new RangeError("Invalid text node in JSON") }
      return schema.text(json.text, marks)
    }
    var content = Fragment.fromJSON(schema, json.content);
    return schema.nodeType(json.type).create(json.attrs, content, marks)
  };
  Object.defineProperties( Node$1.prototype, prototypeAccessors$3$1 );
  var TextNode = (function (Node) {
    function TextNode(type, attrs, content, marks) {
      Node.call(this, type, attrs, null, marks);
      if (!content) { throw new RangeError("Empty text nodes are not allowed") }
      this.text = content;
    }
    if ( Node ) TextNode.__proto__ = Node;
    TextNode.prototype = Object.create( Node && Node.prototype );
    TextNode.prototype.constructor = TextNode;
    var prototypeAccessors$1 = { textContent: { configurable: true },nodeSize: { configurable: true } };
    TextNode.prototype.toString = function toString () {
      if (this.type.spec.toDebugString) { return this.type.spec.toDebugString(this) }
      return wrapMarks(this.marks, JSON.stringify(this.text))
    };
    prototypeAccessors$1.textContent.get = function () { return this.text };
    TextNode.prototype.textBetween = function textBetween (from, to) { return this.text.slice(from, to) };
    prototypeAccessors$1.nodeSize.get = function () { return this.text.length };
    TextNode.prototype.mark = function mark (marks) {
      return marks == this.marks ? this : new TextNode(this.type, this.attrs, this.text, marks)
    };
    TextNode.prototype.withText = function withText (text) {
      if (text == this.text) { return this }
      return new TextNode(this.type, this.attrs, text, this.marks)
    };
    TextNode.prototype.cut = function cut (from, to) {
      if ( from === void 0 ) from = 0;
      if ( to === void 0 ) to = this.text.length;
      if (from == 0 && to == this.text.length) { return this }
      return this.withText(this.text.slice(from, to))
    };
    TextNode.prototype.eq = function eq (other) {
      return this.sameMarkup(other) && this.text == other.text
    };
    TextNode.prototype.toJSON = function toJSON () {
      var base = Node.prototype.toJSON.call(this);
      base.text = this.text;
      return base
    };
    Object.defineProperties( TextNode.prototype, prototypeAccessors$1 );
    return TextNode;
  }(Node$1));
  function wrapMarks(marks, str) {
    for (var i = marks.length - 1; i >= 0; i--)
      { str = marks[i].type.name + "(" + str + ")"; }
    return str
  }
  var ContentMatch = function ContentMatch(validEnd) {
    this.validEnd = validEnd;
    this.next = [];
    this.wrapCache = [];
  };
  var prototypeAccessors$4$1 = { inlineContent: { configurable: true },defaultType: { configurable: true },edgeCount: { configurable: true } };
  ContentMatch.parse = function parse (string, nodeTypes) {
    var stream = new TokenStream(string, nodeTypes);
    if (stream.next == null) { return ContentMatch.empty }
    var expr = parseExpr(stream);
    if (stream.next) { stream.err("Unexpected trailing text"); }
    var match = dfa(nfa(expr));
    checkForDeadEnds(match, stream);
    return match
  };
  ContentMatch.prototype.matchType = function matchType (type) {
    for (var i = 0; i < this.next.length; i += 2)
      { if (this.next[i] == type) { return this.next[i + 1] } }
    return null
  };
  ContentMatch.prototype.matchFragment = function matchFragment (frag, start, end) {
      if ( start === void 0 ) start = 0;
      if ( end === void 0 ) end = frag.childCount;
    var cur = this;
    for (var i = start; cur && i < end; i++)
      { cur = cur.matchType(frag.child(i).type); }
    return cur
  };
  prototypeAccessors$4$1.inlineContent.get = function () {
    var first = this.next[0];
    return first ? first.isInline : false
  };
  prototypeAccessors$4$1.defaultType.get = function () {
    for (var i = 0; i < this.next.length; i += 2) {
      var type = this.next[i];
      if (!(type.isText || type.hasRequiredAttrs())) { return type }
    }
  };
  ContentMatch.prototype.compatible = function compatible (other) {
    for (var i = 0; i < this.next.length; i += 2)
      { for (var j = 0; j < other.next.length; j += 2)
        { if (this.next[i] == other.next[j]) { return true } } }
    return false
  };
  ContentMatch.prototype.fillBefore = function fillBefore (after, toEnd, startIndex) {
      if ( toEnd === void 0 ) toEnd = false;
      if ( startIndex === void 0 ) startIndex = 0;
    var seen = [this];
    function search(match, types) {
      var finished = match.matchFragment(after, startIndex);
      if (finished && (!toEnd || finished.validEnd))
        { return Fragment.from(types.map(function (tp) { return tp.createAndFill(); })) }
      for (var i = 0; i < match.next.length; i += 2) {
        var type = match.next[i], next = match.next[i + 1];
        if (!(type.isText || type.hasRequiredAttrs()) && seen.indexOf(next) == -1) {
          seen.push(next);
          var found = search(next, types.concat(type));
          if (found) { return found }
        }
      }
    }
    return search(this, [])
  };
  ContentMatch.prototype.findWrapping = function findWrapping (target) {
    for (var i = 0; i < this.wrapCache.length; i += 2)
      { if (this.wrapCache[i] == target) { return this.wrapCache[i + 1] } }
    var computed = this.computeWrapping(target);
    this.wrapCache.push(target, computed);
    return computed
  };
  ContentMatch.prototype.computeWrapping = function computeWrapping (target) {
    var seen = Object.create(null), active = [{match: this, type: null, via: null}];
    while (active.length) {
      var current = active.shift(), match = current.match;
      if (match.matchType(target)) {
        var result = [];
        for (var obj = current; obj.type; obj = obj.via)
          { result.push(obj.type); }
        return result.reverse()
      }
      for (var i = 0; i < match.next.length; i += 2) {
        var type = match.next[i];
        if (!type.isLeaf && !type.hasRequiredAttrs() && !(type.name in seen) && (!current.type || match.next[i + 1].validEnd)) {
          active.push({match: type.contentMatch, type: type, via: current});
          seen[type.name] = true;
        }
      }
    }
  };
  prototypeAccessors$4$1.edgeCount.get = function () {
    return this.next.length >> 1
  };
  ContentMatch.prototype.edge = function edge (n) {
    var i = n << 1;
    if (i >= this.next.length) { throw new RangeError(("There's no " + n + "th edge in this content match")) }
    return {type: this.next[i], next: this.next[i + 1]}
  };
  ContentMatch.prototype.toString = function toString () {
    var seen = [];
    function scan(m) {
      seen.push(m);
      for (var i = 1; i < m.next.length; i += 2)
        { if (seen.indexOf(m.next[i]) == -1) { scan(m.next[i]); } }
    }
    scan(this);
    return seen.map(function (m, i) {
      var out = i + (m.validEnd ? "*" : " ") + " ";
      for (var i$1 = 0; i$1 < m.next.length; i$1 += 2)
        { out += (i$1 ? ", " : "") + m.next[i$1].name + "->" + seen.indexOf(m.next[i$1 + 1]); }
      return out
    }).join("\n")
  };
  Object.defineProperties( ContentMatch.prototype, prototypeAccessors$4$1 );
  ContentMatch.empty = new ContentMatch(true);
  var TokenStream = function TokenStream(string, nodeTypes) {
    this.string = string;
    this.nodeTypes = nodeTypes;
    this.inline = null;
    this.pos = 0;
    this.tokens = string.split(/\s*(?=\b|\W|$)/);
    if (this.tokens[this.tokens.length - 1] == "") { this.tokens.pop(); }
    if (this.tokens[0] == "") { this.tokens.shift(); }
  };
  var prototypeAccessors$1$2$1 = { next: { configurable: true } };
  prototypeAccessors$1$2$1.next.get = function () { return this.tokens[this.pos] };
  TokenStream.prototype.eat = function eat (tok) { return this.next == tok && (this.pos++ || true) };
  TokenStream.prototype.err = function err (str) { throw new SyntaxError(str + " (in content expression '" + this.string + "')") };
  Object.defineProperties( TokenStream.prototype, prototypeAccessors$1$2$1 );
  function parseExpr(stream) {
    var exprs = [];
    do { exprs.push(parseExprSeq(stream)); }
    while (stream.eat("|"))
    return exprs.length == 1 ? exprs[0] : {type: "choice", exprs: exprs}
  }
  function parseExprSeq(stream) {
    var exprs = [];
    do { exprs.push(parseExprSubscript(stream)); }
    while (stream.next && stream.next != ")" && stream.next != "|")
    return exprs.length == 1 ? exprs[0] : {type: "seq", exprs: exprs}
  }
  function parseExprSubscript(stream) {
    var expr = parseExprAtom(stream);
    for (;;) {
      if (stream.eat("+"))
        { expr = {type: "plus", expr: expr}; }
      else if (stream.eat("*"))
        { expr = {type: "star", expr: expr}; }
      else if (stream.eat("?"))
        { expr = {type: "opt", expr: expr}; }
      else if (stream.eat("{"))
        { expr = parseExprRange(stream, expr); }
      else { break }
    }
    return expr
  }
  function parseNum(stream) {
    if (/\D/.test(stream.next)) { stream.err("Expected number, got '" + stream.next + "'"); }
    var result = Number(stream.next);
    stream.pos++;
    return result
  }
  function parseExprRange(stream, expr) {
    var min = parseNum(stream), max = min;
    if (stream.eat(",")) {
      if (stream.next != "}") { max = parseNum(stream); }
      else { max = -1; }
    }
    if (!stream.eat("}")) { stream.err("Unclosed braced range"); }
    return {type: "range", min: min, max: max, expr: expr}
  }
  function resolveName(stream, name) {
    var types = stream.nodeTypes, type = types[name];
    if (type) { return [type] }
    var result = [];
    for (var typeName in types) {
      var type$1 = types[typeName];
      if (type$1.groups.indexOf(name) > -1) { result.push(type$1); }
    }
    if (result.length == 0) { stream.err("No node type or group '" + name + "' found"); }
    return result
  }
  function parseExprAtom(stream) {
    if (stream.eat("(")) {
      var expr = parseExpr(stream);
      if (!stream.eat(")")) { stream.err("Missing closing paren"); }
      return expr
    } else if (!/\W/.test(stream.next)) {
      var exprs = resolveName(stream, stream.next).map(function (type) {
        if (stream.inline == null) { stream.inline = type.isInline; }
        else if (stream.inline != type.isInline) { stream.err("Mixing inline and block content"); }
        return {type: "name", value: type}
      });
      stream.pos++;
      return exprs.length == 1 ? exprs[0] : {type: "choice", exprs: exprs}
    } else {
      stream.err("Unexpected token '" + stream.next + "'");
    }
  }
  function nfa(expr) {
    var nfa = [[]];
    connect(compile(expr, 0), node());
    return nfa
    function node() { return nfa.push([]) - 1 }
    function edge(from, to, term) {
      var edge = {term: term, to: to};
      nfa[from].push(edge);
      return edge
    }
    function connect(edges, to) { edges.forEach(function (edge) { return edge.to = to; }); }
    function compile(expr, from) {
      if (expr.type == "choice") {
        return expr.exprs.reduce(function (out, expr) { return out.concat(compile(expr, from)); }, [])
      } else if (expr.type == "seq") {
        for (var i = 0;; i++) {
          var next = compile(expr.exprs[i], from);
          if (i == expr.exprs.length - 1) { return next }
          connect(next, from = node());
        }
      } else if (expr.type == "star") {
        var loop = node();
        edge(from, loop);
        connect(compile(expr.expr, loop), loop);
        return [edge(loop)]
      } else if (expr.type == "plus") {
        var loop$1 = node();
        connect(compile(expr.expr, from), loop$1);
        connect(compile(expr.expr, loop$1), loop$1);
        return [edge(loop$1)]
      } else if (expr.type == "opt") {
        return [edge(from)].concat(compile(expr.expr, from))
      } else if (expr.type == "range") {
        var cur = from;
        for (var i$1 = 0; i$1 < expr.min; i$1++) {
          var next$1 = node();
          connect(compile(expr.expr, cur), next$1);
          cur = next$1;
        }
        if (expr.max == -1) {
          connect(compile(expr.expr, cur), cur);
        } else {
          for (var i$2 = expr.min; i$2 < expr.max; i$2++) {
            var next$2 = node();
            edge(cur, next$2);
            connect(compile(expr.expr, cur), next$2);
            cur = next$2;
          }
        }
        return [edge(cur)]
      } else if (expr.type == "name") {
        return [edge(from, null, expr.value)]
      }
    }
  }
  function cmp(a, b) { return b - a }
  function nullFrom(nfa, node) {
    var result = [];
    scan(node);
    return result.sort(cmp)
    function scan(node) {
      var edges = nfa[node];
      if (edges.length == 1 && !edges[0].term) { return scan(edges[0].to) }
      result.push(node);
      for (var i = 0; i < edges.length; i++) {
        var ref = edges[i];
        var term = ref.term;
        var to = ref.to;
        if (!term && result.indexOf(to) == -1) { scan(to); }
      }
    }
  }
  function dfa(nfa) {
    var labeled = Object.create(null);
    return explore(nullFrom(nfa, 0))
    function explore(states) {
      var out = [];
      states.forEach(function (node) {
        nfa[node].forEach(function (ref) {
          var term = ref.term;
          var to = ref.to;
          if (!term) { return }
          var known = out.indexOf(term), set = known > -1 && out[known + 1];
          nullFrom(nfa, to).forEach(function (node) {
            if (!set) { out.push(term, set = []); }
            if (set.indexOf(node) == -1) { set.push(node); }
          });
        });
      });
      var state = labeled[states.join(",")] = new ContentMatch(states.indexOf(nfa.length - 1) > -1);
      for (var i = 0; i < out.length; i += 2) {
        var states$1 = out[i + 1].sort(cmp);
        state.next.push(out[i], labeled[states$1.join(",")] || explore(states$1));
      }
      return state
    }
  }
  function checkForDeadEnds(match, stream) {
    for (var i = 0, work = [match]; i < work.length; i++) {
      var state = work[i], dead = !state.validEnd, nodes = [];
      for (var j = 0; j < state.next.length; j += 2) {
        var node = state.next[j], next = state.next[j + 1];
        nodes.push(node.name);
        if (dead && !(node.isText || node.hasRequiredAttrs())) { dead = false; }
        if (work.indexOf(next) == -1) { work.push(next); }
      }
      if (dead) { stream.err("Only non-generatable nodes (" + nodes.join(", ") + ") in a required position (see https://prosemirror.net/docs/guide/#generatable)"); }
    }
  }
  function defaultAttrs(attrs) {
    var defaults = Object.create(null);
    for (var attrName in attrs) {
      var attr = attrs[attrName];
      if (!attr.hasDefault) { return null }
      defaults[attrName] = attr.default;
    }
    return defaults
  }
  function computeAttrs(attrs, value) {
    var built = Object.create(null);
    for (var name in attrs) {
      var given = value && value[name];
      if (given === undefined) {
        var attr = attrs[name];
        if (attr.hasDefault) { given = attr.default; }
        else { throw new RangeError("No value supplied for attribute " + name) }
      }
      built[name] = given;
    }
    return built
  }
  function initAttrs(attrs) {
    var result = Object.create(null);
    if (attrs) { for (var name in attrs) { result[name] = new Attribute(attrs[name]); } }
    return result
  }
  var NodeType$1 = function NodeType(name, schema, spec) {
    this.name = name;
    this.schema = schema;
    this.spec = spec;
    this.groups = spec.group ? spec.group.split(" ") : [];
    this.attrs = initAttrs(spec.attrs);
    this.defaultAttrs = defaultAttrs(this.attrs);
    this.contentMatch = null;
    this.markSet = null;
    this.inlineContent = null;
    this.isBlock = !(spec.inline || name == "text");
    this.isText = name == "text";
  };
  var prototypeAccessors$5$1 = { isInline: { configurable: true },isTextblock: { configurable: true },isLeaf: { configurable: true },isAtom: { configurable: true },whitespace: { configurable: true } };
  prototypeAccessors$5$1.isInline.get = function () { return !this.isBlock };
  prototypeAccessors$5$1.isTextblock.get = function () { return this.isBlock && this.inlineContent };
  prototypeAccessors$5$1.isLeaf.get = function () { return this.contentMatch == ContentMatch.empty };
  prototypeAccessors$5$1.isAtom.get = function () { return this.isLeaf || this.spec.atom };
  prototypeAccessors$5$1.whitespace.get = function () { return this.spec.whitespace || (this.spec.code ? "pre" : "normal") };
  NodeType$1.prototype.hasRequiredAttrs = function hasRequiredAttrs () {
    for (var n in this.attrs) { if (this.attrs[n].isRequired) { return true } }
    return false
  };
  NodeType$1.prototype.compatibleContent = function compatibleContent (other) {
    return this == other || this.contentMatch.compatible(other.contentMatch)
  };
  NodeType$1.prototype.computeAttrs = function computeAttrs$1 (attrs) {
    if (!attrs && this.defaultAttrs) { return this.defaultAttrs }
    else { return computeAttrs(this.attrs, attrs) }
  };
  NodeType$1.prototype.create = function create (attrs, content, marks) {
    if (this.isText) { throw new Error("NodeType.create can't construct text nodes") }
    return new Node$1(this, this.computeAttrs(attrs), Fragment.from(content), Mark$1.setFrom(marks))
  };
  NodeType$1.prototype.createChecked = function createChecked (attrs, content, marks) {
    content = Fragment.from(content);
    if (!this.validContent(content))
      { throw new RangeError("Invalid content for node " + this.name) }
    return new Node$1(this, this.computeAttrs(attrs), content, Mark$1.setFrom(marks))
  };
  NodeType$1.prototype.createAndFill = function createAndFill (attrs, content, marks) {
    attrs = this.computeAttrs(attrs);
    content = Fragment.from(content);
    if (content.size) {
      var before = this.contentMatch.fillBefore(content);
      if (!before) { return null }
      content = before.append(content);
    }
    var after = this.contentMatch.matchFragment(content).fillBefore(Fragment.empty, true);
    if (!after) { return null }
    return new Node$1(this, attrs, content.append(after), Mark$1.setFrom(marks))
  };
  NodeType$1.prototype.validContent = function validContent (content) {
    var result = this.contentMatch.matchFragment(content);
    if (!result || !result.validEnd) { return false }
    for (var i = 0; i < content.childCount; i++)
      { if (!this.allowsMarks(content.child(i).marks)) { return false } }
    return true
  };
  NodeType$1.prototype.allowsMarkType = function allowsMarkType (markType) {
    return this.markSet == null || this.markSet.indexOf(markType) > -1
  };
  NodeType$1.prototype.allowsMarks = function allowsMarks (marks) {
    if (this.markSet == null) { return true }
    for (var i = 0; i < marks.length; i++) { if (!this.allowsMarkType(marks[i].type)) { return false } }
    return true
  };
  NodeType$1.prototype.allowedMarks = function allowedMarks (marks) {
    if (this.markSet == null) { return marks }
    var copy;
    for (var i = 0; i < marks.length; i++) {
      if (!this.allowsMarkType(marks[i].type)) {
        if (!copy) { copy = marks.slice(0, i); }
      } else if (copy) {
        copy.push(marks[i]);
      }
    }
    return !copy ? marks : copy.length ? copy : Mark$1.empty
  };
  NodeType$1.compile = function compile (nodes, schema) {
    var result = Object.create(null);
    nodes.forEach(function (name, spec) { return result[name] = new NodeType$1(name, schema, spec); });
    var topType = schema.spec.topNode || "doc";
    if (!result[topType]) { throw new RangeError("Schema is missing its top node type ('" + topType + "')") }
    if (!result.text) { throw new RangeError("Every schema needs a 'text' type") }
    for (var _ in result.text.attrs) { throw new RangeError("The text node type should not have attributes") }
    return result
  };
  Object.defineProperties( NodeType$1.prototype, prototypeAccessors$5$1 );
  var Attribute = function Attribute(options) {
    this.hasDefault = Object.prototype.hasOwnProperty.call(options, "default");
    this.default = options.default;
  };
  var prototypeAccessors$1$3$1 = { isRequired: { configurable: true } };
  prototypeAccessors$1$3$1.isRequired.get = function () {
    return !this.hasDefault
  };
  Object.defineProperties( Attribute.prototype, prototypeAccessors$1$3$1 );
  var MarkType = function MarkType(name, rank, schema, spec) {
    this.name = name;
    this.schema = schema;
    this.spec = spec;
    this.attrs = initAttrs(spec.attrs);
    this.rank = rank;
    this.excluded = null;
    var defaults = defaultAttrs(this.attrs);
    this.instance = defaults && new Mark$1(this, defaults);
  };
  MarkType.prototype.create = function create (attrs) {
    if (!attrs && this.instance) { return this.instance }
    return new Mark$1(this, computeAttrs(this.attrs, attrs))
  };
  MarkType.compile = function compile (marks, schema) {
    var result = Object.create(null), rank = 0;
    marks.forEach(function (name, spec) { return result[name] = new MarkType(name, rank++, schema, spec); });
    return result
  };
  MarkType.prototype.removeFromSet = function removeFromSet (set) {
    for (var i = 0; i < set.length; i++) { if (set[i].type == this) {
      set = set.slice(0, i).concat(set.slice(i + 1));
      i--;
    } }
    return set
  };
  MarkType.prototype.isInSet = function isInSet (set) {
    for (var i = 0; i < set.length; i++)
      { if (set[i].type == this) { return set[i] } }
  };
  MarkType.prototype.excludes = function excludes (other) {
    return this.excluded.indexOf(other) > -1
  };
  var Schema = function Schema(spec) {
    this.spec = {};
    for (var prop in spec) { this.spec[prop] = spec[prop]; }
    this.spec.nodes = orderedmap.from(spec.nodes);
    this.spec.marks = orderedmap.from(spec.marks);
    this.nodes = NodeType$1.compile(this.spec.nodes, this);
    this.marks = MarkType.compile(this.spec.marks, this);
    var contentExprCache = Object.create(null);
    for (var prop$1 in this.nodes) {
      if (prop$1 in this.marks)
        { throw new RangeError(prop$1 + " can not be both a node and a mark") }
      var type = this.nodes[prop$1], contentExpr = type.spec.content || "", markExpr = type.spec.marks;
      type.contentMatch = contentExprCache[contentExpr] ||
        (contentExprCache[contentExpr] = ContentMatch.parse(contentExpr, this.nodes));
      type.inlineContent = type.contentMatch.inlineContent;
      type.markSet = markExpr == "_" ? null :
        markExpr ? gatherMarks(this, markExpr.split(" ")) :
        markExpr == "" || !type.inlineContent ? [] : null;
    }
    for (var prop$2 in this.marks) {
      var type$1 = this.marks[prop$2], excl = type$1.spec.excludes;
      type$1.excluded = excl == null ? [type$1] : excl == "" ? [] : gatherMarks(this, excl.split(" "));
    }
    this.nodeFromJSON = this.nodeFromJSON.bind(this);
    this.markFromJSON = this.markFromJSON.bind(this);
    this.topNodeType = this.nodes[this.spec.topNode || "doc"];
    this.cached = Object.create(null);
    this.cached.wrappings = Object.create(null);
  };
  Schema.prototype.node = function node (type, attrs, content, marks) {
    if (typeof type == "string")
      { type = this.nodeType(type); }
    else if (!(type instanceof NodeType$1))
      { throw new RangeError("Invalid node type: " + type) }
    else if (type.schema != this)
      { throw new RangeError("Node type from different schema used (" + type.name + ")") }
    return type.createChecked(attrs, content, marks)
  };
  Schema.prototype.text = function text (text$1, marks) {
    var type = this.nodes.text;
    return new TextNode(type, type.defaultAttrs, text$1, Mark$1.setFrom(marks))
  };
  Schema.prototype.mark = function mark (type, attrs) {
    if (typeof type == "string") { type = this.marks[type]; }
    return type.create(attrs)
  };
  Schema.prototype.nodeFromJSON = function nodeFromJSON (json) {
    return Node$1.fromJSON(this, json)
  };
  Schema.prototype.markFromJSON = function markFromJSON (json) {
    return Mark$1.fromJSON(this, json)
  };
  Schema.prototype.nodeType = function nodeType (name) {
    var found = this.nodes[name];
    if (!found) { throw new RangeError("Unknown node type: " + name) }
    return found
  };
  function gatherMarks(schema, marks) {
    var found = [];
    for (var i = 0; i < marks.length; i++) {
      var name = marks[i], mark = schema.marks[name], ok = mark;
      if (mark) {
        found.push(mark);
      } else {
        for (var prop in schema.marks) {
          var mark$1 = schema.marks[prop];
          if (name == "_" || (mark$1.spec.group && mark$1.spec.group.split(" ").indexOf(name) > -1))
            { found.push(ok = mark$1); }
        }
      }
      if (!ok) { throw new SyntaxError("Unknown mark type: '" + marks[i] + "'") }
    }
    return found
  }
  var DOMParser = function DOMParser(schema, rules) {
    var this$1$1 = this;
    this.schema = schema;
    this.rules = rules;
    this.tags = [];
    this.styles = [];
    rules.forEach(function (rule) {
      if (rule.tag) { this$1$1.tags.push(rule); }
      else if (rule.style) { this$1$1.styles.push(rule); }
    });
    this.normalizeLists = !this.tags.some(function (r) {
      if (!/^(ul|ol)\b/.test(r.tag) || !r.node) { return false }
      var node = schema.nodes[r.node];
      return node.contentMatch.matchType(node)
    });
  };
  DOMParser.prototype.parse = function parse (dom, options) {
      if ( options === void 0 ) options = {};
    var context = new ParseContext(this, options, false);
    context.addAll(dom, null, options.from, options.to);
    return context.finish()
  };
  DOMParser.prototype.parseSlice = function parseSlice (dom, options) {
      if ( options === void 0 ) options = {};
    var context = new ParseContext(this, options, true);
    context.addAll(dom, null, options.from, options.to);
    return Slice.maxOpen(context.finish())
  };
  DOMParser.prototype.matchTag = function matchTag (dom, context, after) {
    for (var i = after ? this.tags.indexOf(after) + 1 : 0; i < this.tags.length; i++) {
      var rule = this.tags[i];
      if (matches(dom, rule.tag) &&
          (rule.namespace === undefined || dom.namespaceURI == rule.namespace) &&
          (!rule.context || context.matchesContext(rule.context))) {
        if (rule.getAttrs) {
          var result = rule.getAttrs(dom);
          if (result === false) { continue }
          rule.attrs = result;
        }
        return rule
      }
    }
  };
  DOMParser.prototype.matchStyle = function matchStyle (prop, value, context, after) {
    for (var i = after ? this.styles.indexOf(after) + 1 : 0; i < this.styles.length; i++) {
      var rule = this.styles[i];
      if (rule.style.indexOf(prop) != 0 ||
          rule.context && !context.matchesContext(rule.context) ||
          rule.style.length > prop.length &&
          (rule.style.charCodeAt(prop.length) != 61 || rule.style.slice(prop.length + 1) != value))
        { continue }
      if (rule.getAttrs) {
        var result = rule.getAttrs(value);
        if (result === false) { continue }
        rule.attrs = result;
      }
      return rule
    }
  };
  DOMParser.schemaRules = function schemaRules (schema) {
    var result = [];
    function insert(rule) {
      var priority = rule.priority == null ? 50 : rule.priority, i = 0;
      for (; i < result.length; i++) {
        var next = result[i], nextPriority = next.priority == null ? 50 : next.priority;
        if (nextPriority < priority) { break }
      }
      result.splice(i, 0, rule);
    }
    var loop = function ( name ) {
      var rules = schema.marks[name].spec.parseDOM;
      if (rules) { rules.forEach(function (rule) {
        insert(rule = copy(rule));
        rule.mark = name;
      }); }
    };
      for (var name in schema.marks) loop( name );
    var loop$1 = function ( name ) {
      var rules$1 = schema.nodes[name$1].spec.parseDOM;
      if (rules$1) { rules$1.forEach(function (rule) {
        insert(rule = copy(rule));
        rule.node = name$1;
      }); }
    };
      for (var name$1 in schema.nodes) loop$1();
    return result
  };
  DOMParser.fromSchema = function fromSchema (schema) {
    return schema.cached.domParser ||
      (schema.cached.domParser = new DOMParser(schema, DOMParser.schemaRules(schema)))
  };
  var blockTags = {
    address: true, article: true, aside: true, blockquote: true, canvas: true,
    dd: true, div: true, dl: true, fieldset: true, figcaption: true, figure: true,
    footer: true, form: true, h1: true, h2: true, h3: true, h4: true, h5: true,
    h6: true, header: true, hgroup: true, hr: true, li: true, noscript: true, ol: true,
    output: true, p: true, pre: true, section: true, table: true, tfoot: true, ul: true
  };
  var ignoreTags = {
    head: true, noscript: true, object: true, script: true, style: true, title: true
  };
  var listTags = {ol: true, ul: true};
  var OPT_PRESERVE_WS = 1, OPT_PRESERVE_WS_FULL = 2, OPT_OPEN_LEFT = 4;
  function wsOptionsFor(type, preserveWhitespace, base) {
    if (preserveWhitespace != null) { return (preserveWhitespace ? OPT_PRESERVE_WS : 0) |
      (preserveWhitespace === "full" ? OPT_PRESERVE_WS_FULL : 0) }
    return type && type.whitespace == "pre" ? OPT_PRESERVE_WS | OPT_PRESERVE_WS_FULL : base & ~OPT_OPEN_LEFT
  }
  var NodeContext = function NodeContext(type, attrs, marks, pendingMarks, solid, match, options) {
    this.type = type;
    this.attrs = attrs;
    this.solid = solid;
    this.match = match || (options & OPT_OPEN_LEFT ? null : type.contentMatch);
    this.options = options;
    this.content = [];
    this.marks = marks;
    this.activeMarks = Mark$1.none;
    this.pendingMarks = pendingMarks;
    this.stashMarks = [];
  };
  NodeContext.prototype.findWrapping = function findWrapping (node) {
    if (!this.match) {
      if (!this.type) { return [] }
      var fill = this.type.contentMatch.fillBefore(Fragment.from(node));
      if (fill) {
        this.match = this.type.contentMatch.matchFragment(fill);
      } else {
        var start = this.type.contentMatch, wrap;
        if (wrap = start.findWrapping(node.type)) {
          this.match = start;
          return wrap
        } else {
          return null
        }
      }
    }
    return this.match.findWrapping(node.type)
  };
  NodeContext.prototype.finish = function finish (openEnd) {
    if (!(this.options & OPT_PRESERVE_WS)) {
      var last = this.content[this.content.length - 1], m;
      if (last && last.isText && (m = /[ \t\r\n\u000c]+$/.exec(last.text))) {
        if (last.text.length == m[0].length) { this.content.pop(); }
        else { this.content[this.content.length - 1] = last.withText(last.text.slice(0, last.text.length - m[0].length)); }
      }
    }
    var content = Fragment.from(this.content);
    if (!openEnd && this.match)
      { content = content.append(this.match.fillBefore(Fragment.empty, true)); }
    return this.type ? this.type.create(this.attrs, content, this.marks) : content
  };
  NodeContext.prototype.popFromStashMark = function popFromStashMark (mark) {
    for (var i = this.stashMarks.length - 1; i >= 0; i--)
      { if (mark.eq(this.stashMarks[i])) { return this.stashMarks.splice(i, 1)[0] } }
  };
  NodeContext.prototype.applyPending = function applyPending (nextType) {
    for (var i = 0, pending = this.pendingMarks; i < pending.length; i++) {
      var mark = pending[i];
      if ((this.type ? this.type.allowsMarkType(mark.type) : markMayApply(mark.type, nextType)) &&
          !mark.isInSet(this.activeMarks)) {
        this.activeMarks = mark.addToSet(this.activeMarks);
        this.pendingMarks = mark.removeFromSet(this.pendingMarks);
      }
    }
  };
  NodeContext.prototype.inlineContext = function inlineContext (node) {
    if (this.type) { return this.type.inlineContent }
    if (this.content.length) { return this.content[0].isInline }
    return node.parentNode && !blockTags.hasOwnProperty(node.parentNode.nodeName.toLowerCase())
  };
  var ParseContext = function ParseContext(parser, options, open) {
    this.parser = parser;
    this.options = options;
    this.isOpen = open;
    var topNode = options.topNode, topContext;
    var topOptions = wsOptionsFor(null, options.preserveWhitespace, 0) | (open ? OPT_OPEN_LEFT : 0);
    if (topNode)
      { topContext = new NodeContext(topNode.type, topNode.attrs, Mark$1.none, Mark$1.none, true,
                                   options.topMatch || topNode.type.contentMatch, topOptions); }
    else if (open)
      { topContext = new NodeContext(null, null, Mark$1.none, Mark$1.none, true, null, topOptions); }
    else
      { topContext = new NodeContext(parser.schema.topNodeType, null, Mark$1.none, Mark$1.none, true, null, topOptions); }
    this.nodes = [topContext];
    this.open = 0;
    this.find = options.findPositions;
    this.needsBlock = false;
  };
  var prototypeAccessors$6 = { top: { configurable: true },currentPos: { configurable: true } };
  prototypeAccessors$6.top.get = function () {
    return this.nodes[this.open]
  };
  ParseContext.prototype.addDOM = function addDOM (dom) {
    if (dom.nodeType == 3) {
      this.addTextNode(dom);
    } else if (dom.nodeType == 1) {
      var style = dom.getAttribute("style");
      var marks = style ? this.readStyles(parseStyles(style)) : null, top = this.top;
      if (marks != null) { for (var i = 0; i < marks.length; i++) { this.addPendingMark(marks[i]); } }
      this.addElement(dom);
      if (marks != null) { for (var i$1 = 0; i$1 < marks.length; i$1++) { this.removePendingMark(marks[i$1], top); } }
    }
  };
  ParseContext.prototype.addTextNode = function addTextNode (dom) {
    var value = dom.nodeValue;
    var top = this.top;
    if (top.options & OPT_PRESERVE_WS_FULL ||
        top.inlineContext(dom) ||
        /[^ \t\r\n\u000c]/.test(value)) {
      if (!(top.options & OPT_PRESERVE_WS)) {
        value = value.replace(/[ \t\r\n\u000c]+/g, " ");
        if (/^[ \t\r\n\u000c]/.test(value) && this.open == this.nodes.length - 1) {
          var nodeBefore = top.content[top.content.length - 1];
          var domNodeBefore = dom.previousSibling;
          if (!nodeBefore ||
              (domNodeBefore && domNodeBefore.nodeName == 'BR') ||
              (nodeBefore.isText && /[ \t\r\n\u000c]$/.test(nodeBefore.text)))
            { value = value.slice(1); }
        }
      } else if (!(top.options & OPT_PRESERVE_WS_FULL)) {
        value = value.replace(/\r?\n|\r/g, " ");
      } else {
        value = value.replace(/\r\n?/g, "\n");
      }
      if (value) { this.insertNode(this.parser.schema.text(value)); }
      this.findInText(dom);
    } else {
      this.findInside(dom);
    }
  };
  ParseContext.prototype.addElement = function addElement (dom, matchAfter) {
    var name = dom.nodeName.toLowerCase(), ruleID;
    if (listTags.hasOwnProperty(name) && this.parser.normalizeLists) { normalizeList(dom); }
    var rule = (this.options.ruleFromNode && this.options.ruleFromNode(dom)) ||
        (ruleID = this.parser.matchTag(dom, this, matchAfter));
    if (rule ? rule.ignore : ignoreTags.hasOwnProperty(name)) {
      this.findInside(dom);
      this.ignoreFallback(dom);
    } else if (!rule || rule.skip || rule.closeParent) {
      if (rule && rule.closeParent) { this.open = Math.max(0, this.open - 1); }
      else if (rule && rule.skip.nodeType) { dom = rule.skip; }
      var sync, top = this.top, oldNeedsBlock = this.needsBlock;
      if (blockTags.hasOwnProperty(name)) {
        sync = true;
        if (!top.type) { this.needsBlock = true; }
      } else if (!dom.firstChild) {
        this.leafFallback(dom);
        return
      }
      this.addAll(dom);
      if (sync) { this.sync(top); }
      this.needsBlock = oldNeedsBlock;
    } else {
      this.addElementByRule(dom, rule, rule.consuming === false ? ruleID : null);
    }
  };
  ParseContext.prototype.leafFallback = function leafFallback (dom) {
    if (dom.nodeName == "BR" && this.top.type && this.top.type.inlineContent)
      { this.addTextNode(dom.ownerDocument.createTextNode("\n")); }
  };
  ParseContext.prototype.ignoreFallback = function ignoreFallback (dom) {
    if (dom.nodeName == "BR" && (!this.top.type || !this.top.type.inlineContent))
      { this.findPlace(this.parser.schema.text("-")); }
  };
  ParseContext.prototype.readStyles = function readStyles (styles) {
    var marks = Mark$1.none;
    style: for (var i = 0; i < styles.length; i += 2) {
      for (var after = null;;) {
        var rule = this.parser.matchStyle(styles[i], styles[i + 1], this, after);
        if (!rule) { continue style }
        if (rule.ignore) { return null }
        marks = this.parser.schema.marks[rule.mark].create(rule.attrs).addToSet(marks);
        if (rule.consuming === false) { after = rule; }
        else { break }
      }
    }
    return marks
  };
  ParseContext.prototype.addElementByRule = function addElementByRule (dom, rule, continueAfter) {
      var this$1$1 = this;
    var sync, nodeType, markType, mark;
    if (rule.node) {
      nodeType = this.parser.schema.nodes[rule.node];
      if (!nodeType.isLeaf) {
        sync = this.enter(nodeType, rule.attrs, rule.preserveWhitespace);
      } else if (!this.insertNode(nodeType.create(rule.attrs))) {
        this.leafFallback(dom);
      }
    } else {
      markType = this.parser.schema.marks[rule.mark];
      mark = markType.create(rule.attrs);
      this.addPendingMark(mark);
    }
    var startIn = this.top;
    if (nodeType && nodeType.isLeaf) {
      this.findInside(dom);
    } else if (continueAfter) {
      this.addElement(dom, continueAfter);
    } else if (rule.getContent) {
      this.findInside(dom);
      rule.getContent(dom, this.parser.schema).forEach(function (node) { return this$1$1.insertNode(node); });
    } else {
      var contentDOM = rule.contentElement;
      if (typeof contentDOM == "string") { contentDOM = dom.querySelector(contentDOM); }
      else if (typeof contentDOM == "function") { contentDOM = contentDOM(dom); }
      if (!contentDOM) { contentDOM = dom; }
      this.findAround(dom, contentDOM, true);
      this.addAll(contentDOM, sync);
    }
    if (sync) { this.sync(startIn); this.open--; }
    if (mark) { this.removePendingMark(mark, startIn); }
  };
  ParseContext.prototype.addAll = function addAll (parent, sync, startIndex, endIndex) {
    var index = startIndex || 0;
    for (var dom = startIndex ? parent.childNodes[startIndex] : parent.firstChild,
             end = endIndex == null ? null : parent.childNodes[endIndex];
         dom != end; dom = dom.nextSibling, ++index) {
      this.findAtPoint(parent, index);
      this.addDOM(dom);
      if (sync && blockTags.hasOwnProperty(dom.nodeName.toLowerCase()))
        { this.sync(sync); }
    }
    this.findAtPoint(parent, index);
  };
  ParseContext.prototype.findPlace = function findPlace (node) {
    var route, sync;
    for (var depth = this.open; depth >= 0; depth--) {
      var cx = this.nodes[depth];
      var found = cx.findWrapping(node);
      if (found && (!route || route.length > found.length)) {
        route = found;
        sync = cx;
        if (!found.length) { break }
      }
      if (cx.solid) { break }
    }
    if (!route) { return false }
    this.sync(sync);
    for (var i = 0; i < route.length; i++)
      { this.enterInner(route[i], null, false); }
    return true
  };
  ParseContext.prototype.insertNode = function insertNode (node) {
    if (node.isInline && this.needsBlock && !this.top.type) {
      var block = this.textblockFromContext();
      if (block) { this.enterInner(block); }
    }
    if (this.findPlace(node)) {
      this.closeExtra();
      var top = this.top;
      top.applyPending(node.type);
      if (top.match) { top.match = top.match.matchType(node.type); }
      var marks = top.activeMarks;
      for (var i = 0; i < node.marks.length; i++)
        { if (!top.type || top.type.allowsMarkType(node.marks[i].type))
          { marks = node.marks[i].addToSet(marks); } }
      top.content.push(node.mark(marks));
      return true
    }
    return false
  };
  ParseContext.prototype.enter = function enter (type, attrs, preserveWS) {
    var ok = this.findPlace(type.create(attrs));
    if (ok) { this.enterInner(type, attrs, true, preserveWS); }
    return ok
  };
  ParseContext.prototype.enterInner = function enterInner (type, attrs, solid, preserveWS) {
    this.closeExtra();
    var top = this.top;
    top.applyPending(type);
    top.match = top.match && top.match.matchType(type, attrs);
    var options = wsOptionsFor(type, preserveWS, top.options);
    if ((top.options & OPT_OPEN_LEFT) && top.content.length == 0) { options |= OPT_OPEN_LEFT; }
    this.nodes.push(new NodeContext(type, attrs, top.activeMarks, top.pendingMarks, solid, null, options));
    this.open++;
  };
  ParseContext.prototype.closeExtra = function closeExtra (openEnd) {
    var i = this.nodes.length - 1;
    if (i > this.open) {
      for (; i > this.open; i--) { this.nodes[i - 1].content.push(this.nodes[i].finish(openEnd)); }
      this.nodes.length = this.open + 1;
    }
  };
  ParseContext.prototype.finish = function finish () {
    this.open = 0;
    this.closeExtra(this.isOpen);
    return this.nodes[0].finish(this.isOpen || this.options.topOpen)
  };
  ParseContext.prototype.sync = function sync (to) {
    for (var i = this.open; i >= 0; i--) { if (this.nodes[i] == to) {
      this.open = i;
      return
    } }
  };
  prototypeAccessors$6.currentPos.get = function () {
    this.closeExtra();
    var pos = 0;
    for (var i = this.open; i >= 0; i--) {
      var content = this.nodes[i].content;
      for (var j = content.length - 1; j >= 0; j--)
        { pos += content[j].nodeSize; }
      if (i) { pos++; }
    }
    return pos
  };
  ParseContext.prototype.findAtPoint = function findAtPoint (parent, offset) {
    if (this.find) { for (var i = 0; i < this.find.length; i++) {
      if (this.find[i].node == parent && this.find[i].offset == offset)
        { this.find[i].pos = this.currentPos; }
    } }
  };
  ParseContext.prototype.findInside = function findInside (parent) {
    if (this.find) { for (var i = 0; i < this.find.length; i++) {
      if (this.find[i].pos == null && parent.nodeType == 1 && parent.contains(this.find[i].node))
        { this.find[i].pos = this.currentPos; }
    } }
  };
  ParseContext.prototype.findAround = function findAround (parent, content, before) {
    if (parent != content && this.find) { for (var i = 0; i < this.find.length; i++) {
      if (this.find[i].pos == null && parent.nodeType == 1 && parent.contains(this.find[i].node)) {
        var pos = content.compareDocumentPosition(this.find[i].node);
        if (pos & (before ? 2 : 4))
          { this.find[i].pos = this.currentPos; }
      }
    } }
  };
  ParseContext.prototype.findInText = function findInText (textNode) {
    if (this.find) { for (var i = 0; i < this.find.length; i++) {
      if (this.find[i].node == textNode)
        { this.find[i].pos = this.currentPos - (textNode.nodeValue.length - this.find[i].offset); }
    } }
  };
  ParseContext.prototype.matchesContext = function matchesContext (context) {
      var this$1$1 = this;
    if (context.indexOf("|") > -1)
      { return context.split(/\s*\|\s*/).some(this.matchesContext, this) }
    var parts = context.split("/");
    var option = this.options.context;
    var useRoot = !this.isOpen && (!option || option.parent.type == this.nodes[0].type);
    var minDepth = -(option ? option.depth + 1 : 0) + (useRoot ? 0 : 1);
    var match = function (i, depth) {
      for (; i >= 0; i--) {
        var part = parts[i];
        if (part == "") {
          if (i == parts.length - 1 || i == 0) { continue }
          for (; depth >= minDepth; depth--)
            { if (match(i - 1, depth)) { return true } }
          return false
        } else {
          var next = depth > 0 || (depth == 0 && useRoot) ? this$1$1.nodes[depth].type
              : option && depth >= minDepth ? option.node(depth - minDepth).type
              : null;
          if (!next || (next.name != part && next.groups.indexOf(part) == -1))
            { return false }
          depth--;
        }
      }
      return true
    };
    return match(parts.length - 1, this.open)
  };
  ParseContext.prototype.textblockFromContext = function textblockFromContext () {
    var $context = this.options.context;
    if ($context) { for (var d = $context.depth; d >= 0; d--) {
      var deflt = $context.node(d).contentMatchAt($context.indexAfter(d)).defaultType;
      if (deflt && deflt.isTextblock && deflt.defaultAttrs) { return deflt }
    } }
    for (var name in this.parser.schema.nodes) {
      var type = this.parser.schema.nodes[name];
      if (type.isTextblock && type.defaultAttrs) { return type }
    }
  };
  ParseContext.prototype.addPendingMark = function addPendingMark (mark) {
    var found = findSameMarkInSet(mark, this.top.pendingMarks);
    if (found) { this.top.stashMarks.push(found); }
    this.top.pendingMarks = mark.addToSet(this.top.pendingMarks);
  };
  ParseContext.prototype.removePendingMark = function removePendingMark (mark, upto) {
    for (var depth = this.open; depth >= 0; depth--) {
      var level = this.nodes[depth];
      var found = level.pendingMarks.lastIndexOf(mark);
      if (found > -1) {
        level.pendingMarks = mark.removeFromSet(level.pendingMarks);
      } else {
        level.activeMarks = mark.removeFromSet(level.activeMarks);
        var stashMark = level.popFromStashMark(mark);
        if (stashMark && level.type && level.type.allowsMarkType(stashMark.type))
          { level.activeMarks = stashMark.addToSet(level.activeMarks); }
      }
      if (level == upto) { break }
    }
  };
  Object.defineProperties( ParseContext.prototype, prototypeAccessors$6 );
  function normalizeList(dom) {
    for (var child = dom.firstChild, prevItem = null; child; child = child.nextSibling) {
      var name = child.nodeType == 1 ? child.nodeName.toLowerCase() : null;
      if (name && listTags.hasOwnProperty(name) && prevItem) {
        prevItem.appendChild(child);
        child = prevItem;
      } else if (name == "li") {
        prevItem = child;
      } else if (name) {
        prevItem = null;
      }
    }
  }
  function matches(dom, selector) {
    return (dom.matches || dom.msMatchesSelector || dom.webkitMatchesSelector || dom.mozMatchesSelector).call(dom, selector)
  }
  function parseStyles(style) {
    var re = /\s*([\w-]+)\s*:\s*([^;]+)/g, m, result = [];
    while (m = re.exec(style)) { result.push(m[1], m[2].trim()); }
    return result
  }
  function copy(obj) {
    var copy = {};
    for (var prop in obj) { copy[prop] = obj[prop]; }
    return copy
  }
  function markMayApply(markType, nodeType) {
    var nodes = nodeType.schema.nodes;
    var loop = function ( name ) {
      var parent = nodes[name];
      if (!parent.allowsMarkType(markType)) { return }
      var seen = [], scan = function (match) {
        seen.push(match);
        for (var i = 0; i < match.edgeCount; i++) {
          var ref = match.edge(i);
          var type = ref.type;
          var next = ref.next;
          if (type == nodeType) { return true }
          if (seen.indexOf(next) < 0 && scan(next)) { return true }
        }
      };
      if (scan(parent.contentMatch)) { return { v: true } }
    };
    for (var name in nodes) {
      var returned = loop( name );
      if ( returned ) return returned.v;
    }
  }
  function findSameMarkInSet(mark, set) {
    for (var i = 0; i < set.length; i++) {
      if (mark.eq(set[i])) { return set[i] }
    }
  }
  var DOMSerializer = function DOMSerializer(nodes, marks) {
    this.nodes = nodes || {};
    this.marks = marks || {};
  };
  DOMSerializer.prototype.serializeFragment = function serializeFragment (fragment, options, target) {
      var this$1$1 = this;
      if ( options === void 0 ) options = {};
    if (!target) { target = doc(options).createDocumentFragment(); }
    var top = target, active = null;
    fragment.forEach(function (node) {
      if (active || node.marks.length) {
        if (!active) { active = []; }
        var keep = 0, rendered = 0;
        while (keep < active.length && rendered < node.marks.length) {
          var next = node.marks[rendered];
          if (!this$1$1.marks[next.type.name]) { rendered++; continue }
          if (!next.eq(active[keep]) || next.type.spec.spanning === false) { break }
          keep += 2; rendered++;
        }
        while (keep < active.length) {
          top = active.pop();
          active.pop();
        }
        while (rendered < node.marks.length) {
          var add = node.marks[rendered++];
          var markDOM = this$1$1.serializeMark(add, node.isInline, options);
          if (markDOM) {
            active.push(add, top);
            top.appendChild(markDOM.dom);
            top = markDOM.contentDOM || markDOM.dom;
          }
        }
      }
      top.appendChild(this$1$1.serializeNodeInner(node, options));
    });
    return target
  };
  DOMSerializer.prototype.serializeNodeInner = function serializeNodeInner (node, options) {
      if ( options === void 0 ) options = {};
    var ref =
        DOMSerializer.renderSpec(doc(options), this.nodes[node.type.name](node));
      var dom = ref.dom;
      var contentDOM = ref.contentDOM;
    if (contentDOM) {
      if (node.isLeaf)
        { throw new RangeError("Content hole not allowed in a leaf node spec") }
      if (options.onContent)
        { options.onContent(node, contentDOM, options); }
      else
        { this.serializeFragment(node.content, options, contentDOM); }
    }
    return dom
  };
  DOMSerializer.prototype.serializeNode = function serializeNode (node, options) {
      if ( options === void 0 ) options = {};
    var dom = this.serializeNodeInner(node, options);
    for (var i = node.marks.length - 1; i >= 0; i--) {
      var wrap = this.serializeMark(node.marks[i], node.isInline, options);
      if (wrap) {
  (wrap.contentDOM || wrap.dom).appendChild(dom);
        dom = wrap.dom;
      }
    }
    return dom
  };
  DOMSerializer.prototype.serializeMark = function serializeMark (mark, inline, options) {
      if ( options === void 0 ) options = {};
    var toDOM = this.marks[mark.type.name];
    return toDOM && DOMSerializer.renderSpec(doc(options), toDOM(mark, inline))
  };
  DOMSerializer.renderSpec = function renderSpec (doc, structure, xmlNS) {
      if ( xmlNS === void 0 ) xmlNS = null;
    if (typeof structure == "string")
      { return {dom: doc.createTextNode(structure)} }
    if (structure.nodeType != null)
      { return {dom: structure} }
    if (structure.dom && structure.dom.nodeType != null)
      { return structure }
    var tagName = structure[0], space = tagName.indexOf(" ");
    if (space > 0) {
      xmlNS = tagName.slice(0, space);
      tagName = tagName.slice(space + 1);
    }
    var contentDOM = null, dom = xmlNS ? doc.createElementNS(xmlNS, tagName) : doc.createElement(tagName);
    var attrs = structure[1], start = 1;
    if (attrs && typeof attrs == "object" && attrs.nodeType == null && !Array.isArray(attrs)) {
      start = 2;
      for (var name in attrs) { if (attrs[name] != null) {
        var space$1 = name.indexOf(" ");
        if (space$1 > 0) { dom.setAttributeNS(name.slice(0, space$1), name.slice(space$1 + 1), attrs[name]); }
        else { dom.setAttribute(name, attrs[name]); }
      } }
    }
    for (var i = start; i < structure.length; i++) {
      var child = structure[i];
      if (child === 0) {
        if (i < structure.length - 1 || i > start)
          { throw new RangeError("Content hole must be the only child of its parent node") }
        return {dom: dom, contentDOM: dom}
      } else {
        var ref = DOMSerializer.renderSpec(doc, child, xmlNS);
          var inner = ref.dom;
          var innerContent = ref.contentDOM;
        dom.appendChild(inner);
        if (innerContent) {
          if (contentDOM) { throw new RangeError("Multiple content holes") }
          contentDOM = innerContent;
        }
      }
    }
    return {dom: dom, contentDOM: contentDOM}
  };
  DOMSerializer.fromSchema = function fromSchema (schema) {
    return schema.cached.domSerializer ||
      (schema.cached.domSerializer = new DOMSerializer(this.nodesFromSchema(schema), this.marksFromSchema(schema)))
  };
  DOMSerializer.nodesFromSchema = function nodesFromSchema (schema) {
    var result = gatherToDOM(schema.nodes);
    if (!result.text) { result.text = function (node) { return node.text; }; }
    return result
  };
  DOMSerializer.marksFromSchema = function marksFromSchema (schema) {
    return gatherToDOM(schema.marks)
  };
  function gatherToDOM(obj) {
    var result = {};
    for (var name in obj) {
      var toDOM = obj[name].spec.toDOM;
      if (toDOM) { result[name] = toDOM; }
    }
    return result
  }
  function doc(options) {
    return options.document || window.document
  }

  var lower16 = 0xffff;
  var factor16 = Math.pow(2, 16);
  function makeRecover(index, offset) { return index + offset * factor16 }
  function recoverIndex(value) { return value & lower16 }
  function recoverOffset(value) { return (value - (value & lower16)) / factor16 }
  var MapResult = function MapResult(pos, deleted, recover) {
    if ( deleted === void 0 ) deleted = false;
    if ( recover === void 0 ) recover = null;
    this.pos = pos;
    this.deleted = deleted;
    this.recover = recover;
  };
  var StepMap = function StepMap(ranges, inverted) {
    if ( inverted === void 0 ) inverted = false;
    if (!ranges.length && StepMap.empty) { return StepMap.empty }
    this.ranges = ranges;
    this.inverted = inverted;
  };
  StepMap.prototype.recover = function recover (value) {
    var diff = 0, index = recoverIndex(value);
    if (!this.inverted) { for (var i = 0; i < index; i++)
      { diff += this.ranges[i * 3 + 2] - this.ranges[i * 3 + 1]; } }
    return this.ranges[index * 3] + diff + recoverOffset(value)
  };
  StepMap.prototype.mapResult = function mapResult (pos, assoc) {
    if ( assoc === void 0 ) assoc = 1;
   return this._map(pos, assoc, false) };
  StepMap.prototype.map = function map (pos, assoc) {
    if ( assoc === void 0 ) assoc = 1;
   return this._map(pos, assoc, true) };
  StepMap.prototype._map = function _map (pos, assoc, simple) {
    var diff = 0, oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
    for (var i = 0; i < this.ranges.length; i += 3) {
      var start = this.ranges[i] - (this.inverted ? diff : 0);
      if (start > pos) { break }
      var oldSize = this.ranges[i + oldIndex], newSize = this.ranges[i + newIndex], end = start + oldSize;
      if (pos <= end) {
        var side = !oldSize ? assoc : pos == start ? -1 : pos == end ? 1 : assoc;
        var result = start + diff + (side < 0 ? 0 : newSize);
        if (simple) { return result }
        var recover = pos == (assoc < 0 ? start : end) ? null : makeRecover(i / 3, pos - start);
        return new MapResult(result, assoc < 0 ? pos != start : pos != end, recover)
      }
      diff += newSize - oldSize;
    }
    return simple ? pos + diff : new MapResult(pos + diff)
  };
  StepMap.prototype.touches = function touches (pos, recover) {
    var diff = 0, index = recoverIndex(recover);
    var oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
    for (var i = 0; i < this.ranges.length; i += 3) {
      var start = this.ranges[i] - (this.inverted ? diff : 0);
      if (start > pos) { break }
      var oldSize = this.ranges[i + oldIndex], end = start + oldSize;
      if (pos <= end && i == index * 3) { return true }
      diff += this.ranges[i + newIndex] - oldSize;
    }
    return false
  };
  StepMap.prototype.forEach = function forEach (f) {
    var oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
    for (var i = 0, diff = 0; i < this.ranges.length; i += 3) {
      var start = this.ranges[i], oldStart = start - (this.inverted ? diff : 0), newStart = start + (this.inverted ? 0 : diff);
      var oldSize = this.ranges[i + oldIndex], newSize = this.ranges[i + newIndex];
      f(oldStart, oldStart + oldSize, newStart, newStart + newSize);
      diff += newSize - oldSize;
    }
  };
  StepMap.prototype.invert = function invert () {
    return new StepMap(this.ranges, !this.inverted)
  };
  StepMap.prototype.toString = function toString () {
    return (this.inverted ? "-" : "") + JSON.stringify(this.ranges)
  };
  StepMap.offset = function offset (n) {
    return n == 0 ? StepMap.empty : new StepMap(n < 0 ? [0, -n, 0] : [0, 0, n])
  };
  StepMap.empty = new StepMap([]);
  var Mapping = function Mapping(maps, mirror, from, to) {
    this.maps = maps || [];
    this.from = from || 0;
    this.to = to == null ? this.maps.length : to;
    this.mirror = mirror;
  };
  Mapping.prototype.slice = function slice (from, to) {
      if ( from === void 0 ) from = 0;
      if ( to === void 0 ) to = this.maps.length;
    return new Mapping(this.maps, this.mirror, from, to)
  };
  Mapping.prototype.copy = function copy () {
    return new Mapping(this.maps.slice(), this.mirror && this.mirror.slice(), this.from, this.to)
  };
  Mapping.prototype.appendMap = function appendMap (map, mirrors) {
    this.to = this.maps.push(map);
    if (mirrors != null) { this.setMirror(this.maps.length - 1, mirrors); }
  };
  Mapping.prototype.appendMapping = function appendMapping (mapping) {
    for (var i = 0, startSize = this.maps.length; i < mapping.maps.length; i++) {
      var mirr = mapping.getMirror(i);
      this.appendMap(mapping.maps[i], mirr != null && mirr < i ? startSize + mirr : null);
    }
  };
  Mapping.prototype.getMirror = function getMirror (n) {
    if (this.mirror) { for (var i = 0; i < this.mirror.length; i++)
      { if (this.mirror[i] == n) { return this.mirror[i + (i % 2 ? -1 : 1)] } } }
  };
  Mapping.prototype.setMirror = function setMirror (n, m) {
    if (!this.mirror) { this.mirror = []; }
    this.mirror.push(n, m);
  };
  Mapping.prototype.appendMappingInverted = function appendMappingInverted (mapping) {
    for (var i = mapping.maps.length - 1, totalSize = this.maps.length + mapping.maps.length; i >= 0; i--) {
      var mirr = mapping.getMirror(i);
      this.appendMap(mapping.maps[i].invert(), mirr != null && mirr > i ? totalSize - mirr - 1 : null);
    }
  };
  Mapping.prototype.invert = function invert () {
    var inverse = new Mapping;
    inverse.appendMappingInverted(this);
    return inverse
  };
  Mapping.prototype.map = function map (pos, assoc) {
      if ( assoc === void 0 ) assoc = 1;
    if (this.mirror) { return this._map(pos, assoc, true) }
    for (var i = this.from; i < this.to; i++)
      { pos = this.maps[i].map(pos, assoc); }
    return pos
  };
  Mapping.prototype.mapResult = function mapResult (pos, assoc) {
    if ( assoc === void 0 ) assoc = 1;
   return this._map(pos, assoc, false) };
  Mapping.prototype._map = function _map (pos, assoc, simple) {
    var deleted = false;
    for (var i = this.from; i < this.to; i++) {
      var map = this.maps[i], result = map.mapResult(pos, assoc);
      if (result.recover != null) {
        var corr = this.getMirror(i);
        if (corr != null && corr > i && corr < this.to) {
          i = corr;
          pos = this.maps[corr].recover(result.recover);
          continue
        }
      }
      if (result.deleted) { deleted = true; }
      pos = result.pos;
    }
    return simple ? pos : new MapResult(pos, deleted)
  };
  function TransformError(message) {
    var err = Error.call(this, message);
    err.__proto__ = TransformError.prototype;
    return err
  }
  TransformError.prototype = Object.create(Error.prototype);
  TransformError.prototype.constructor = TransformError;
  TransformError.prototype.name = "TransformError";
  var Transform = function Transform(doc) {
    this.doc = doc;
    this.steps = [];
    this.docs = [];
    this.mapping = new Mapping;
  };
  var prototypeAccessors$4 = { before: { configurable: true },docChanged: { configurable: true } };
  prototypeAccessors$4.before.get = function () { return this.docs.length ? this.docs[0] : this.doc };
  Transform.prototype.step = function step (object) {
    var result = this.maybeStep(object);
    if (result.failed) { throw new TransformError(result.failed) }
    return this
  };
  Transform.prototype.maybeStep = function maybeStep (step) {
    var result = step.apply(this.doc);
    if (!result.failed) { this.addStep(step, result.doc); }
    return result
  };
  prototypeAccessors$4.docChanged.get = function () {
    return this.steps.length > 0
  };
  Transform.prototype.addStep = function addStep (step, doc) {
    this.docs.push(this.doc);
    this.steps.push(step);
    this.mapping.appendMap(step.getMap());
    this.doc = doc;
  };
  Object.defineProperties( Transform.prototype, prototypeAccessors$4 );
  function mustOverride() { throw new Error("Override me") }
  var stepsByID = Object.create(null);
  var Step = function Step () {};
  Step.prototype.apply = function apply (_doc) { return mustOverride() };
  Step.prototype.getMap = function getMap () { return StepMap.empty };
  Step.prototype.invert = function invert (_doc) { return mustOverride() };
  Step.prototype.map = function map (_mapping) { return mustOverride() };
  Step.prototype.merge = function merge (_other) { return null };
  Step.prototype.toJSON = function toJSON () { return mustOverride() };
  Step.fromJSON = function fromJSON (schema, json) {
    if (!json || !json.stepType) { throw new RangeError("Invalid input for Step.fromJSON") }
    var type = stepsByID[json.stepType];
    if (!type) { throw new RangeError(("No step type " + (json.stepType) + " defined")) }
    return type.fromJSON(schema, json)
  };
  Step.jsonID = function jsonID (id, stepClass) {
    if (id in stepsByID) { throw new RangeError("Duplicate use of step JSON ID " + id) }
    stepsByID[id] = stepClass;
    stepClass.prototype.jsonID = id;
    return stepClass
  };
  var StepResult = function StepResult(doc, failed) {
    this.doc = doc;
    this.failed = failed;
  };
  StepResult.ok = function ok (doc) { return new StepResult(doc, null) };
  StepResult.fail = function fail (message) { return new StepResult(null, message) };
  StepResult.fromReplace = function fromReplace (doc, from, to, slice) {
    try {
      return StepResult.ok(doc.replace(from, to, slice))
    } catch (e) {
      if (e instanceof ReplaceError) { return StepResult.fail(e.message) }
      throw e
    }
  };
  var ReplaceStep = (function (Step) {
    function ReplaceStep(from, to, slice, structure) {
      Step.call(this);
      this.from = from;
      this.to = to;
      this.slice = slice;
      this.structure = !!structure;
    }
    if ( Step ) ReplaceStep.__proto__ = Step;
    ReplaceStep.prototype = Object.create( Step && Step.prototype );
    ReplaceStep.prototype.constructor = ReplaceStep;
    ReplaceStep.prototype.apply = function apply (doc) {
      if (this.structure && contentBetween(doc, this.from, this.to))
        { return StepResult.fail("Structure replace would overwrite content") }
      return StepResult.fromReplace(doc, this.from, this.to, this.slice)
    };
    ReplaceStep.prototype.getMap = function getMap () {
      return new StepMap([this.from, this.to - this.from, this.slice.size])
    };
    ReplaceStep.prototype.invert = function invert (doc) {
      return new ReplaceStep(this.from, this.from + this.slice.size, doc.slice(this.from, this.to))
    };
    ReplaceStep.prototype.map = function map (mapping) {
      var from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted) { return null }
      return new ReplaceStep(from.pos, Math.max(from.pos, to.pos), this.slice)
    };
    ReplaceStep.prototype.merge = function merge (other) {
      if (!(other instanceof ReplaceStep) || other.structure || this.structure) { return null }
      if (this.from + this.slice.size == other.from && !this.slice.openEnd && !other.slice.openStart) {
        var slice = this.slice.size + other.slice.size == 0 ? Slice.empty
            : new Slice(this.slice.content.append(other.slice.content), this.slice.openStart, other.slice.openEnd);
        return new ReplaceStep(this.from, this.to + (other.to - other.from), slice, this.structure)
      } else if (other.to == this.from && !this.slice.openStart && !other.slice.openEnd) {
        var slice$1 = this.slice.size + other.slice.size == 0 ? Slice.empty
            : new Slice(other.slice.content.append(this.slice.content), other.slice.openStart, this.slice.openEnd);
        return new ReplaceStep(other.from, this.to, slice$1, this.structure)
      } else {
        return null
      }
    };
    ReplaceStep.prototype.toJSON = function toJSON () {
      var json = {stepType: "replace", from: this.from, to: this.to};
      if (this.slice.size) { json.slice = this.slice.toJSON(); }
      if (this.structure) { json.structure = true; }
      return json
    };
    ReplaceStep.fromJSON = function fromJSON (schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        { throw new RangeError("Invalid input for ReplaceStep.fromJSON") }
      return new ReplaceStep(json.from, json.to, Slice.fromJSON(schema, json.slice), !!json.structure)
    };
    return ReplaceStep;
  }(Step));
  Step.jsonID("replace", ReplaceStep);
  var ReplaceAroundStep = (function (Step) {
    function ReplaceAroundStep(from, to, gapFrom, gapTo, slice, insert, structure) {
      Step.call(this);
      this.from = from;
      this.to = to;
      this.gapFrom = gapFrom;
      this.gapTo = gapTo;
      this.slice = slice;
      this.insert = insert;
      this.structure = !!structure;
    }
    if ( Step ) ReplaceAroundStep.__proto__ = Step;
    ReplaceAroundStep.prototype = Object.create( Step && Step.prototype );
    ReplaceAroundStep.prototype.constructor = ReplaceAroundStep;
    ReplaceAroundStep.prototype.apply = function apply (doc) {
      if (this.structure && (contentBetween(doc, this.from, this.gapFrom) ||
                             contentBetween(doc, this.gapTo, this.to)))
        { return StepResult.fail("Structure gap-replace would overwrite content") }
      var gap = doc.slice(this.gapFrom, this.gapTo);
      if (gap.openStart || gap.openEnd)
        { return StepResult.fail("Gap is not a flat range") }
      var inserted = this.slice.insertAt(this.insert, gap.content);
      if (!inserted) { return StepResult.fail("Content does not fit in gap") }
      return StepResult.fromReplace(doc, this.from, this.to, inserted)
    };
    ReplaceAroundStep.prototype.getMap = function getMap () {
      return new StepMap([this.from, this.gapFrom - this.from, this.insert,
                          this.gapTo, this.to - this.gapTo, this.slice.size - this.insert])
    };
    ReplaceAroundStep.prototype.invert = function invert (doc) {
      var gap = this.gapTo - this.gapFrom;
      return new ReplaceAroundStep(this.from, this.from + this.slice.size + gap,
                                   this.from + this.insert, this.from + this.insert + gap,
                                   doc.slice(this.from, this.to).removeBetween(this.gapFrom - this.from, this.gapTo - this.from),
                                   this.gapFrom - this.from, this.structure)
    };
    ReplaceAroundStep.prototype.map = function map (mapping) {
      var from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      var gapFrom = mapping.map(this.gapFrom, -1), gapTo = mapping.map(this.gapTo, 1);
      if ((from.deleted && to.deleted) || gapFrom < from.pos || gapTo > to.pos) { return null }
      return new ReplaceAroundStep(from.pos, to.pos, gapFrom, gapTo, this.slice, this.insert, this.structure)
    };
    ReplaceAroundStep.prototype.toJSON = function toJSON () {
      var json = {stepType: "replaceAround", from: this.from, to: this.to,
                  gapFrom: this.gapFrom, gapTo: this.gapTo, insert: this.insert};
      if (this.slice.size) { json.slice = this.slice.toJSON(); }
      if (this.structure) { json.structure = true; }
      return json
    };
    ReplaceAroundStep.fromJSON = function fromJSON (schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number" ||
          typeof json.gapFrom != "number" || typeof json.gapTo != "number" || typeof json.insert != "number")
        { throw new RangeError("Invalid input for ReplaceAroundStep.fromJSON") }
      return new ReplaceAroundStep(json.from, json.to, json.gapFrom, json.gapTo,
                                   Slice.fromJSON(schema, json.slice), json.insert, !!json.structure)
    };
    return ReplaceAroundStep;
  }(Step));
  Step.jsonID("replaceAround", ReplaceAroundStep);
  function contentBetween(doc, from, to) {
    var $from = doc.resolve(from), dist = to - from, depth = $from.depth;
    while (dist > 0 && depth > 0 && $from.indexAfter(depth) == $from.node(depth).childCount) {
      depth--;
      dist--;
    }
    if (dist > 0) {
      var next = $from.node(depth).maybeChild($from.indexAfter(depth));
      while (dist > 0) {
        if (!next || next.isLeaf) { return true }
        next = next.firstChild;
        dist--;
      }
    }
    return false
  }
  function canCut(node, start, end) {
    return (start == 0 || node.canReplace(start, node.childCount)) &&
      (end == node.childCount || node.canReplace(0, end))
  }
  function liftTarget(range) {
    var parent = range.parent;
    var content = parent.content.cutByIndex(range.startIndex, range.endIndex);
    for (var depth = range.depth;; --depth) {
      var node = range.$from.node(depth);
      var index = range.$from.index(depth), endIndex = range.$to.indexAfter(depth);
      if (depth < range.depth && node.canReplace(index, endIndex, content))
        { return depth }
      if (depth == 0 || node.type.spec.isolating || !canCut(node, index, endIndex)) { break }
    }
  }
  Transform.prototype.lift = function(range, target) {
    var $from = range.$from;
    var $to = range.$to;
    var depth = range.depth;
    var gapStart = $from.before(depth + 1), gapEnd = $to.after(depth + 1);
    var start = gapStart, end = gapEnd;
    var before = Fragment.empty, openStart = 0;
    for (var d = depth, splitting = false; d > target; d--)
      { if (splitting || $from.index(d) > 0) {
        splitting = true;
        before = Fragment.from($from.node(d).copy(before));
        openStart++;
      } else {
        start--;
      } }
    var after = Fragment.empty, openEnd = 0;
    for (var d$1 = depth, splitting$1 = false; d$1 > target; d$1--)
      { if (splitting$1 || $to.after(d$1 + 1) < $to.end(d$1)) {
        splitting$1 = true;
        after = Fragment.from($to.node(d$1).copy(after));
        openEnd++;
      } else {
        end++;
      } }
    return this.step(new ReplaceAroundStep(start, end, gapStart, gapEnd,
                                           new Slice(before.append(after), openStart, openEnd),
                                           before.size - openStart, true))
  };
  function findWrapping(range, nodeType, attrs, innerRange) {
    if ( innerRange === void 0 ) innerRange = range;
    var around = findWrappingOutside(range, nodeType);
    var inner = around && findWrappingInside(innerRange, nodeType);
    if (!inner) { return null }
    return around.map(withAttrs).concat({type: nodeType, attrs: attrs}).concat(inner.map(withAttrs))
  }
  function withAttrs(type) { return {type: type, attrs: null} }
  function findWrappingOutside(range, type) {
    var parent = range.parent;
    var startIndex = range.startIndex;
    var endIndex = range.endIndex;
    var around = parent.contentMatchAt(startIndex).findWrapping(type);
    if (!around) { return null }
    var outer = around.length ? around[0] : type;
    return parent.canReplaceWith(startIndex, endIndex, outer) ? around : null
  }
  function findWrappingInside(range, type) {
    var parent = range.parent;
    var startIndex = range.startIndex;
    var endIndex = range.endIndex;
    var inner = parent.child(startIndex);
    var inside = type.contentMatch.findWrapping(inner.type);
    if (!inside) { return null }
    var lastType = inside.length ? inside[inside.length - 1] : type;
    var innerMatch = lastType.contentMatch;
    for (var i = startIndex; innerMatch && i < endIndex; i++)
      { innerMatch = innerMatch.matchType(parent.child(i).type); }
    if (!innerMatch || !innerMatch.validEnd) { return null }
    return inside
  }
  Transform.prototype.wrap = function(range, wrappers) {
    var content = Fragment.empty;
    for (var i = wrappers.length - 1; i >= 0; i--) {
      if (content.size) {
        var match = wrappers[i].type.contentMatch.matchFragment(content);
        if (!match || !match.validEnd)
          { throw new RangeError("Wrapper type given to Transform.wrap does not form valid content of its parent wrapper") }
      }
      content = Fragment.from(wrappers[i].type.create(wrappers[i].attrs, content));
    }
    var start = range.start, end = range.end;
    return this.step(new ReplaceAroundStep(start, end, start, end, new Slice(content, 0, 0), wrappers.length, true))
  };
  Transform.prototype.setBlockType = function(from, to, type, attrs) {
    var this$1$1 = this;
    if ( to === void 0 ) to = from;
    if (!type.isTextblock) { throw new RangeError("Type given to setBlockType should be a textblock") }
    var mapFrom = this.steps.length;
    this.doc.nodesBetween(from, to, function (node, pos) {
      if (node.isTextblock && !node.hasMarkup(type, attrs) && canChangeType(this$1$1.doc, this$1$1.mapping.slice(mapFrom).map(pos), type)) {
        this$1$1.clearIncompatible(this$1$1.mapping.slice(mapFrom).map(pos, 1), type);
        var mapping = this$1$1.mapping.slice(mapFrom);
        var startM = mapping.map(pos, 1), endM = mapping.map(pos + node.nodeSize, 1);
        this$1$1.step(new ReplaceAroundStep(startM, endM, startM + 1, endM - 1,
                                        new Slice(Fragment.from(type.create(attrs, null, node.marks)), 0, 0), 1, true));
        return false
      }
    });
    return this
  };
  function canChangeType(doc, pos, type) {
    var $pos = doc.resolve(pos), index = $pos.index();
    return $pos.parent.canReplaceWith(index, index + 1, type)
  }
  Transform.prototype.setNodeMarkup = function(pos, type, attrs, marks) {
    var node = this.doc.nodeAt(pos);
    if (!node) { throw new RangeError("No node at given position") }
    if (!type) { type = node.type; }
    var newNode = type.create(attrs, null, marks || node.marks);
    if (node.isLeaf)
      { return this.replaceWith(pos, pos + node.nodeSize, newNode) }
    if (!type.validContent(node.content))
      { throw new RangeError("Invalid content for node type " + type.name) }
    return this.step(new ReplaceAroundStep(pos, pos + node.nodeSize, pos + 1, pos + node.nodeSize - 1,
                                           new Slice(Fragment.from(newNode), 0, 0), 1, true))
  };
  function canSplit(doc, pos, depth, typesAfter) {
    if ( depth === void 0 ) depth = 1;
    var $pos = doc.resolve(pos), base = $pos.depth - depth;
    var innerType = (typesAfter && typesAfter[typesAfter.length - 1]) || $pos.parent;
    if (base < 0 || $pos.parent.type.spec.isolating ||
        !$pos.parent.canReplace($pos.index(), $pos.parent.childCount) ||
        !innerType.type.validContent($pos.parent.content.cutByIndex($pos.index(), $pos.parent.childCount)))
      { return false }
    for (var d = $pos.depth - 1, i = depth - 2; d > base; d--, i--) {
      var node = $pos.node(d), index$1 = $pos.index(d);
      if (node.type.spec.isolating) { return false }
      var rest = node.content.cutByIndex(index$1, node.childCount);
      var after = (typesAfter && typesAfter[i]) || node;
      if (after != node) { rest = rest.replaceChild(0, after.type.create(after.attrs)); }
      if (!node.canReplace(index$1 + 1, node.childCount) || !after.type.validContent(rest))
        { return false }
    }
    var index = $pos.indexAfter(base);
    var baseType = typesAfter && typesAfter[0];
    return $pos.node(base).canReplaceWith(index, index, baseType ? baseType.type : $pos.node(base + 1).type)
  }
  Transform.prototype.split = function(pos, depth, typesAfter) {
    if ( depth === void 0 ) depth = 1;
    var $pos = this.doc.resolve(pos), before = Fragment.empty, after = Fragment.empty;
    for (var d = $pos.depth, e = $pos.depth - depth, i = depth - 1; d > e; d--, i--) {
      before = Fragment.from($pos.node(d).copy(before));
      var typeAfter = typesAfter && typesAfter[i];
      after = Fragment.from(typeAfter ? typeAfter.type.create(typeAfter.attrs, after) : $pos.node(d).copy(after));
    }
    return this.step(new ReplaceStep(pos, pos, new Slice(before.append(after), depth, depth), true))
  };
  function canJoin(doc, pos) {
    var $pos = doc.resolve(pos), index = $pos.index();
    return joinable($pos.nodeBefore, $pos.nodeAfter) &&
      $pos.parent.canReplace(index, index + 1)
  }
  function joinable(a, b) {
    return a && b && !a.isLeaf && a.canAppend(b)
  }
  Transform.prototype.join = function(pos, depth) {
    if ( depth === void 0 ) depth = 1;
    var step = new ReplaceStep(pos - depth, pos + depth, Slice.empty, true);
    return this.step(step)
  };
  function insertPoint(doc, pos, nodeType) {
    var $pos = doc.resolve(pos);
    if ($pos.parent.canReplaceWith($pos.index(), $pos.index(), nodeType)) { return pos }
    if ($pos.parentOffset == 0)
      { for (var d = $pos.depth - 1; d >= 0; d--) {
        var index = $pos.index(d);
        if ($pos.node(d).canReplaceWith(index, index, nodeType)) { return $pos.before(d + 1) }
        if (index > 0) { return null }
      } }
    if ($pos.parentOffset == $pos.parent.content.size)
      { for (var d$1 = $pos.depth - 1; d$1 >= 0; d$1--) {
        var index$1 = $pos.indexAfter(d$1);
        if ($pos.node(d$1).canReplaceWith(index$1, index$1, nodeType)) { return $pos.after(d$1 + 1) }
        if (index$1 < $pos.node(d$1).childCount) { return null }
      } }
  }
  function dropPoint(doc, pos, slice) {
    var $pos = doc.resolve(pos);
    if (!slice.content.size) { return pos }
    var content = slice.content;
    for (var i = 0; i < slice.openStart; i++) { content = content.firstChild.content; }
    for (var pass = 1; pass <= (slice.openStart == 0 && slice.size ? 2 : 1); pass++) {
      for (var d = $pos.depth; d >= 0; d--) {
        var bias = d == $pos.depth ? 0 : $pos.pos <= ($pos.start(d + 1) + $pos.end(d + 1)) / 2 ? -1 : 1;
        var insertPos = $pos.index(d) + (bias > 0 ? 1 : 0);
        var parent = $pos.node(d), fits = false;
        if (pass == 1) {
          fits = parent.canReplace(insertPos, insertPos, content);
        } else {
          var wrapping = parent.contentMatchAt(insertPos).findWrapping(content.firstChild.type);
          fits = wrapping && parent.canReplaceWith(insertPos, insertPos, wrapping[0]);
        }
        if (fits)
          { return bias == 0 ? $pos.pos : bias < 0 ? $pos.before(d + 1) : $pos.after(d + 1) }
      }
    }
    return null
  }
  function mapFragment(fragment, f, parent) {
    var mapped = [];
    for (var i = 0; i < fragment.childCount; i++) {
      var child = fragment.child(i);
      if (child.content.size) { child = child.copy(mapFragment(child.content, f, child)); }
      if (child.isInline) { child = f(child, parent, i); }
      mapped.push(child);
    }
    return Fragment.fromArray(mapped)
  }
  var AddMarkStep = (function (Step) {
    function AddMarkStep(from, to, mark) {
      Step.call(this);
      this.from = from;
      this.to = to;
      this.mark = mark;
    }
    if ( Step ) AddMarkStep.__proto__ = Step;
    AddMarkStep.prototype = Object.create( Step && Step.prototype );
    AddMarkStep.prototype.constructor = AddMarkStep;
    AddMarkStep.prototype.apply = function apply (doc) {
      var this$1$1 = this;
      var oldSlice = doc.slice(this.from, this.to), $from = doc.resolve(this.from);
      var parent = $from.node($from.sharedDepth(this.to));
      var slice = new Slice(mapFragment(oldSlice.content, function (node, parent) {
        if (!node.isAtom || !parent.type.allowsMarkType(this$1$1.mark.type)) { return node }
        return node.mark(this$1$1.mark.addToSet(node.marks))
      }, parent), oldSlice.openStart, oldSlice.openEnd);
      return StepResult.fromReplace(doc, this.from, this.to, slice)
    };
    AddMarkStep.prototype.invert = function invert () {
      return new RemoveMarkStep(this.from, this.to, this.mark)
    };
    AddMarkStep.prototype.map = function map (mapping) {
      var from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted || from.pos >= to.pos) { return null }
      return new AddMarkStep(from.pos, to.pos, this.mark)
    };
    AddMarkStep.prototype.merge = function merge (other) {
      if (other instanceof AddMarkStep &&
          other.mark.eq(this.mark) &&
          this.from <= other.to && this.to >= other.from)
        { return new AddMarkStep(Math.min(this.from, other.from),
                               Math.max(this.to, other.to), this.mark) }
    };
    AddMarkStep.prototype.toJSON = function toJSON () {
      return {stepType: "addMark", mark: this.mark.toJSON(),
              from: this.from, to: this.to}
    };
    AddMarkStep.fromJSON = function fromJSON (schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        { throw new RangeError("Invalid input for AddMarkStep.fromJSON") }
      return new AddMarkStep(json.from, json.to, schema.markFromJSON(json.mark))
    };
    return AddMarkStep;
  }(Step));
  Step.jsonID("addMark", AddMarkStep);
  var RemoveMarkStep = (function (Step) {
    function RemoveMarkStep(from, to, mark) {
      Step.call(this);
      this.from = from;
      this.to = to;
      this.mark = mark;
    }
    if ( Step ) RemoveMarkStep.__proto__ = Step;
    RemoveMarkStep.prototype = Object.create( Step && Step.prototype );
    RemoveMarkStep.prototype.constructor = RemoveMarkStep;
    RemoveMarkStep.prototype.apply = function apply (doc) {
      var this$1$1 = this;
      var oldSlice = doc.slice(this.from, this.to);
      var slice = new Slice(mapFragment(oldSlice.content, function (node) {
        return node.mark(this$1$1.mark.removeFromSet(node.marks))
      }), oldSlice.openStart, oldSlice.openEnd);
      return StepResult.fromReplace(doc, this.from, this.to, slice)
    };
    RemoveMarkStep.prototype.invert = function invert () {
      return new AddMarkStep(this.from, this.to, this.mark)
    };
    RemoveMarkStep.prototype.map = function map (mapping) {
      var from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted || from.pos >= to.pos) { return null }
      return new RemoveMarkStep(from.pos, to.pos, this.mark)
    };
    RemoveMarkStep.prototype.merge = function merge (other) {
      if (other instanceof RemoveMarkStep &&
          other.mark.eq(this.mark) &&
          this.from <= other.to && this.to >= other.from)
        { return new RemoveMarkStep(Math.min(this.from, other.from),
                                  Math.max(this.to, other.to), this.mark) }
    };
    RemoveMarkStep.prototype.toJSON = function toJSON () {
      return {stepType: "removeMark", mark: this.mark.toJSON(),
              from: this.from, to: this.to}
    };
    RemoveMarkStep.fromJSON = function fromJSON (schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        { throw new RangeError("Invalid input for RemoveMarkStep.fromJSON") }
      return new RemoveMarkStep(json.from, json.to, schema.markFromJSON(json.mark))
    };
    return RemoveMarkStep;
  }(Step));
  Step.jsonID("removeMark", RemoveMarkStep);
  Transform.prototype.addMark = function(from, to, mark) {
    var this$1$1 = this;
    var removed = [], added = [], removing = null, adding = null;
    this.doc.nodesBetween(from, to, function (node, pos, parent) {
      if (!node.isInline) { return }
      var marks = node.marks;
      if (!mark.isInSet(marks) && parent.type.allowsMarkType(mark.type)) {
        var start = Math.max(pos, from), end = Math.min(pos + node.nodeSize, to);
        var newSet = mark.addToSet(marks);
        for (var i = 0; i < marks.length; i++) {
          if (!marks[i].isInSet(newSet)) {
            if (removing && removing.to == start && removing.mark.eq(marks[i]))
              { removing.to = end; }
            else
              { removed.push(removing = new RemoveMarkStep(start, end, marks[i])); }
          }
        }
        if (adding && adding.to == start)
          { adding.to = end; }
        else
          { added.push(adding = new AddMarkStep(start, end, mark)); }
      }
    });
    removed.forEach(function (s) { return this$1$1.step(s); });
    added.forEach(function (s) { return this$1$1.step(s); });
    return this
  };
  Transform.prototype.removeMark = function(from, to, mark) {
    var this$1$1 = this;
    if ( mark === void 0 ) mark = null;
    var matched = [], step = 0;
    this.doc.nodesBetween(from, to, function (node, pos) {
      if (!node.isInline) { return }
      step++;
      var toRemove = null;
      if (mark instanceof MarkType) {
        var set = node.marks, found;
        while (found = mark.isInSet(set)) {
  (toRemove || (toRemove = [])).push(found);
          set = found.removeFromSet(set);
        }
      } else if (mark) {
        if (mark.isInSet(node.marks)) { toRemove = [mark]; }
      } else {
        toRemove = node.marks;
      }
      if (toRemove && toRemove.length) {
        var end = Math.min(pos + node.nodeSize, to);
        for (var i = 0; i < toRemove.length; i++) {
          var style = toRemove[i], found$1 = (void 0);
          for (var j = 0; j < matched.length; j++) {
            var m = matched[j];
            if (m.step == step - 1 && style.eq(matched[j].style)) { found$1 = m; }
          }
          if (found$1) {
            found$1.to = end;
            found$1.step = step;
          } else {
            matched.push({style: style, from: Math.max(pos, from), to: end, step: step});
          }
        }
      }
    });
    matched.forEach(function (m) { return this$1$1.step(new RemoveMarkStep(m.from, m.to, m.style)); });
    return this
  };
  Transform.prototype.clearIncompatible = function(pos, parentType, match) {
    if ( match === void 0 ) match = parentType.contentMatch;
    var node = this.doc.nodeAt(pos);
    var delSteps = [], cur = pos + 1;
    for (var i = 0; i < node.childCount; i++) {
      var child = node.child(i), end = cur + child.nodeSize;
      var allowed = match.matchType(child.type, child.attrs);
      if (!allowed) {
        delSteps.push(new ReplaceStep(cur, end, Slice.empty));
      } else {
        match = allowed;
        for (var j = 0; j < child.marks.length; j++) { if (!parentType.allowsMarkType(child.marks[j].type))
          { this.step(new RemoveMarkStep(cur, end, child.marks[j])); } }
      }
      cur = end;
    }
    if (!match.validEnd) {
      var fill = match.fillBefore(Fragment.empty, true);
      this.replace(cur, cur, new Slice(fill, 0, 0));
    }
    for (var i$1 = delSteps.length - 1; i$1 >= 0; i$1--) { this.step(delSteps[i$1]); }
    return this
  };
  function replaceStep(doc, from, to, slice) {
    if ( to === void 0 ) to = from;
    if ( slice === void 0 ) slice = Slice.empty;
    if (from == to && !slice.size) { return null }
    var $from = doc.resolve(from), $to = doc.resolve(to);
    if (fitsTrivially($from, $to, slice)) { return new ReplaceStep(from, to, slice) }
    return new Fitter($from, $to, slice).fit()
  }
  Transform.prototype.replace = function(from, to, slice) {
    if ( to === void 0 ) to = from;
    if ( slice === void 0 ) slice = Slice.empty;
    var step = replaceStep(this.doc, from, to, slice);
    if (step) { this.step(step); }
    return this
  };
  Transform.prototype.replaceWith = function(from, to, content) {
    return this.replace(from, to, new Slice(Fragment.from(content), 0, 0))
  };
  Transform.prototype.delete = function(from, to) {
    return this.replace(from, to, Slice.empty)
  };
  Transform.prototype.insert = function(pos, content) {
    return this.replaceWith(pos, pos, content)
  };
  function fitsTrivially($from, $to, slice) {
    return !slice.openStart && !slice.openEnd && $from.start() == $to.start() &&
      $from.parent.canReplace($from.index(), $to.index(), slice.content)
  }
  var Fitter = function Fitter($from, $to, slice) {
    this.$to = $to;
    this.$from = $from;
    this.unplaced = slice;
    this.frontier = [];
    for (var i = 0; i <= $from.depth; i++) {
      var node = $from.node(i);
      this.frontier.push({
        type: node.type,
        match: node.contentMatchAt($from.indexAfter(i))
      });
    }
    this.placed = Fragment.empty;
    for (var i$1 = $from.depth; i$1 > 0; i$1--)
      { this.placed = Fragment.from($from.node(i$1).copy(this.placed)); }
  };
  var prototypeAccessors$1$2 = { depth: { configurable: true } };
  prototypeAccessors$1$2.depth.get = function () { return this.frontier.length - 1 };
  Fitter.prototype.fit = function fit () {
    while (this.unplaced.size) {
      var fit = this.findFittable();
      if (fit) { this.placeNodes(fit); }
      else { this.openMore() || this.dropNode(); }
    }
    var moveInline = this.mustMoveInline(), placedSize = this.placed.size - this.depth - this.$from.depth;
    var $from = this.$from, $to = this.close(moveInline < 0 ? this.$to : $from.doc.resolve(moveInline));
    if (!$to) { return null }
    var content = this.placed, openStart = $from.depth, openEnd = $to.depth;
    while (openStart && openEnd && content.childCount == 1) {
      content = content.firstChild.content;
      openStart--; openEnd--;
    }
    var slice = new Slice(content, openStart, openEnd);
    if (moveInline > -1)
      { return new ReplaceAroundStep($from.pos, moveInline, this.$to.pos, this.$to.end(), slice, placedSize) }
    if (slice.size || $from.pos != this.$to.pos)
      { return new ReplaceStep($from.pos, $to.pos, slice) }
  };
  Fitter.prototype.findFittable = function findFittable () {
    for (var pass = 1; pass <= 2; pass++) {
      for (var sliceDepth = this.unplaced.openStart; sliceDepth >= 0; sliceDepth--) {
        var fragment = (void 0), parent = (void 0);
        if (sliceDepth) {
          parent = contentAt(this.unplaced.content, sliceDepth - 1).firstChild;
          fragment = parent.content;
        } else {
          fragment = this.unplaced.content;
        }
        var first = fragment.firstChild;
        for (var frontierDepth = this.depth; frontierDepth >= 0; frontierDepth--) {
          var ref = this.frontier[frontierDepth];
            var type = ref.type;
            var match = ref.match;
            var wrap = (void 0), inject = (void 0);
          if (pass == 1 && (first ? match.matchType(first.type) || (inject = match.fillBefore(Fragment.from(first), false))
                            : type.compatibleContent(parent.type)))
            { return {sliceDepth: sliceDepth, frontierDepth: frontierDepth, parent: parent, inject: inject} }
          else if (pass == 2 && first && (wrap = match.findWrapping(first.type)))
            { return {sliceDepth: sliceDepth, frontierDepth: frontierDepth, parent: parent, wrap: wrap} }
          if (parent && match.matchType(parent.type)) { break }
        }
      }
    }
  };
  Fitter.prototype.openMore = function openMore () {
    var ref = this.unplaced;
      var content = ref.content;
      var openStart = ref.openStart;
      var openEnd = ref.openEnd;
    var inner = contentAt(content, openStart);
    if (!inner.childCount || inner.firstChild.isLeaf) { return false }
    this.unplaced = new Slice(content, openStart + 1,
                              Math.max(openEnd, inner.size + openStart >= content.size - openEnd ? openStart + 1 : 0));
    return true
  };
  Fitter.prototype.dropNode = function dropNode () {
    var ref = this.unplaced;
      var content = ref.content;
      var openStart = ref.openStart;
      var openEnd = ref.openEnd;
    var inner = contentAt(content, openStart);
    if (inner.childCount <= 1 && openStart > 0) {
      var openAtEnd = content.size - openStart <= openStart + inner.size;
      this.unplaced = new Slice(dropFromFragment(content, openStart - 1, 1), openStart - 1,
                                openAtEnd ? openStart - 1 : openEnd);
    } else {
      this.unplaced = new Slice(dropFromFragment(content, openStart, 1), openStart, openEnd);
    }
  };
  Fitter.prototype.placeNodes = function placeNodes (ref) {
      var sliceDepth = ref.sliceDepth;
      var frontierDepth = ref.frontierDepth;
      var parent = ref.parent;
      var inject = ref.inject;
      var wrap = ref.wrap;
    while (this.depth > frontierDepth) { this.closeFrontierNode(); }
    if (wrap) { for (var i = 0; i < wrap.length; i++) { this.openFrontierNode(wrap[i]); } }
    var slice = this.unplaced, fragment = parent ? parent.content : slice.content;
    var openStart = slice.openStart - sliceDepth;
    var taken = 0, add = [];
    var ref$1 = this.frontier[frontierDepth];
      var match = ref$1.match;
      var type = ref$1.type;
    if (inject) {
      for (var i$1 = 0; i$1 < inject.childCount; i$1++) { add.push(inject.child(i$1)); }
      match = match.matchFragment(inject);
    }
    var openEndCount = (fragment.size + sliceDepth) - (slice.content.size - slice.openEnd);
    while (taken < fragment.childCount) {
      var next = fragment.child(taken), matches = match.matchType(next.type);
      if (!matches) { break }
      taken++;
      if (taken > 1 || openStart == 0 || next.content.size) {
        match = matches;
        add.push(closeNodeStart(next.mark(type.allowedMarks(next.marks)), taken == 1 ? openStart : 0,
                                taken == fragment.childCount ? openEndCount : -1));
      }
    }
    var toEnd = taken == fragment.childCount;
    if (!toEnd) { openEndCount = -1; }
    this.placed = addToFragment(this.placed, frontierDepth, Fragment.from(add));
    this.frontier[frontierDepth].match = match;
    if (toEnd && openEndCount < 0 && parent && parent.type == this.frontier[this.depth].type && this.frontier.length > 1)
      { this.closeFrontierNode(); }
    for (var i$2 = 0, cur = fragment; i$2 < openEndCount; i$2++) {
      var node = cur.lastChild;
      this.frontier.push({type: node.type, match: node.contentMatchAt(node.childCount)});
      cur = node.content;
    }
    this.unplaced = !toEnd ? new Slice(dropFromFragment(slice.content, sliceDepth, taken), slice.openStart, slice.openEnd)
      : sliceDepth == 0 ? Slice.empty
      : new Slice(dropFromFragment(slice.content, sliceDepth - 1, 1),
                  sliceDepth - 1, openEndCount < 0 ? slice.openEnd : sliceDepth - 1);
  };
  Fitter.prototype.mustMoveInline = function mustMoveInline () {
    if (!this.$to.parent.isTextblock || this.$to.end() == this.$to.pos) { return -1 }
    var top = this.frontier[this.depth], level;
    if (!top.type.isTextblock || !contentAfterFits(this.$to, this.$to.depth, top.type, top.match, false) ||
        (this.$to.depth == this.depth && (level = this.findCloseLevel(this.$to)) && level.depth == this.depth)) { return -1 }
    var ref = this.$to;
      var depth = ref.depth;
      var after = this.$to.after(depth);
    while (depth > 1 && after == this.$to.end(--depth)) { ++after; }
    return after
  };
  Fitter.prototype.findCloseLevel = function findCloseLevel ($to) {
    scan: for (var i = Math.min(this.depth, $to.depth); i >= 0; i--) {
      var ref = this.frontier[i];
        var match = ref.match;
        var type = ref.type;
      var dropInner = i < $to.depth && $to.end(i + 1) == $to.pos + ($to.depth - (i + 1));
      var fit = contentAfterFits($to, i, type, match, dropInner);
      if (!fit) { continue }
      for (var d = i - 1; d >= 0; d--) {
        var ref$1 = this.frontier[d];
          var match$1 = ref$1.match;
          var type$1 = ref$1.type;
        var matches = contentAfterFits($to, d, type$1, match$1, true);
        if (!matches || matches.childCount) { continue scan }
      }
      return {depth: i, fit: fit, move: dropInner ? $to.doc.resolve($to.after(i + 1)) : $to}
    }
  };
  Fitter.prototype.close = function close ($to) {
    var close = this.findCloseLevel($to);
    if (!close) { return null }
    while (this.depth > close.depth) { this.closeFrontierNode(); }
    if (close.fit.childCount) { this.placed = addToFragment(this.placed, close.depth, close.fit); }
    $to = close.move;
    for (var d = close.depth + 1; d <= $to.depth; d++) {
      var node = $to.node(d), add = node.type.contentMatch.fillBefore(node.content, true, $to.index(d));
      this.openFrontierNode(node.type, node.attrs, add);
    }
    return $to
  };
  Fitter.prototype.openFrontierNode = function openFrontierNode (type, attrs, content) {
    var top = this.frontier[this.depth];
    top.match = top.match.matchType(type);
    this.placed = addToFragment(this.placed, this.depth, Fragment.from(type.create(attrs, content)));
    this.frontier.push({type: type, match: type.contentMatch});
  };
  Fitter.prototype.closeFrontierNode = function closeFrontierNode () {
    var open = this.frontier.pop();
    var add = open.match.fillBefore(Fragment.empty, true);
    if (add.childCount) { this.placed = addToFragment(this.placed, this.frontier.length, add); }
  };
  Object.defineProperties( Fitter.prototype, prototypeAccessors$1$2 );
  function dropFromFragment(fragment, depth, count) {
    if (depth == 0) { return fragment.cutByIndex(count) }
    return fragment.replaceChild(0, fragment.firstChild.copy(dropFromFragment(fragment.firstChild.content, depth - 1, count)))
  }
  function addToFragment(fragment, depth, content) {
    if (depth == 0) { return fragment.append(content) }
    return fragment.replaceChild(fragment.childCount - 1,
                                 fragment.lastChild.copy(addToFragment(fragment.lastChild.content, depth - 1, content)))
  }
  function contentAt(fragment, depth) {
    for (var i = 0; i < depth; i++) { fragment = fragment.firstChild.content; }
    return fragment
  }
  function closeNodeStart(node, openStart, openEnd) {
    if (openStart <= 0) { return node }
    var frag = node.content;
    if (openStart > 1)
      { frag = frag.replaceChild(0, closeNodeStart(frag.firstChild, openStart - 1, frag.childCount == 1 ? openEnd - 1 : 0)); }
    if (openStart > 0) {
      frag = node.type.contentMatch.fillBefore(frag).append(frag);
      if (openEnd <= 0) { frag = frag.append(node.type.contentMatch.matchFragment(frag).fillBefore(Fragment.empty, true)); }
    }
    return node.copy(frag)
  }
  function contentAfterFits($to, depth, type, match, open) {
    var node = $to.node(depth), index = open ? $to.indexAfter(depth) : $to.index(depth);
    if (index == node.childCount && !type.compatibleContent(node.type)) { return null }
    var fit = match.fillBefore(node.content, true, index);
    return fit && !invalidMarks(type, node.content, index) ? fit : null
  }
  function invalidMarks(type, fragment, start) {
    for (var i = start; i < fragment.childCount; i++)
      { if (!type.allowsMarks(fragment.child(i).marks)) { return true } }
    return false
  }
  Transform.prototype.replaceRange = function(from, to, slice) {
    if (!slice.size) { return this.deleteRange(from, to) }
    var $from = this.doc.resolve(from), $to = this.doc.resolve(to);
    if (fitsTrivially($from, $to, slice))
      { return this.step(new ReplaceStep(from, to, slice)) }
    var targetDepths = coveredDepths($from, this.doc.resolve(to));
    if (targetDepths[targetDepths.length - 1] == 0) { targetDepths.pop(); }
    var preferredTarget = -($from.depth + 1);
    targetDepths.unshift(preferredTarget);
    for (var d = $from.depth, pos = $from.pos - 1; d > 0; d--, pos--) {
      var spec = $from.node(d).type.spec;
      if (spec.defining || spec.isolating) { break }
      if (targetDepths.indexOf(d) > -1) { preferredTarget = d; }
      else if ($from.before(d) == pos) { targetDepths.splice(1, 0, -d); }
    }
    var preferredTargetIndex = targetDepths.indexOf(preferredTarget);
    var leftNodes = [], preferredDepth = slice.openStart;
    for (var content = slice.content, i = 0;; i++) {
      var node = content.firstChild;
      leftNodes.push(node);
      if (i == slice.openStart) { break }
      content = node.content;
    }
    if (preferredDepth > 0 && leftNodes[preferredDepth - 1].type.spec.defining &&
        $from.node(preferredTargetIndex).type != leftNodes[preferredDepth - 1].type)
      { preferredDepth -= 1; }
    else if (preferredDepth >= 2 && leftNodes[preferredDepth - 1].isTextblock && leftNodes[preferredDepth - 2].type.spec.defining &&
             $from.node(preferredTargetIndex).type != leftNodes[preferredDepth - 2].type)
      { preferredDepth -= 2; }
    for (var j = slice.openStart; j >= 0; j--) {
      var openDepth = (j + preferredDepth + 1) % (slice.openStart + 1);
      var insert = leftNodes[openDepth];
      if (!insert) { continue }
      for (var i$1 = 0; i$1 < targetDepths.length; i$1++) {
        var targetDepth = targetDepths[(i$1 + preferredTargetIndex) % targetDepths.length], expand = true;
        if (targetDepth < 0) { expand = false; targetDepth = -targetDepth; }
        var parent = $from.node(targetDepth - 1), index = $from.index(targetDepth - 1);
        if (parent.canReplaceWith(index, index, insert.type, insert.marks))
          { return this.replace($from.before(targetDepth), expand ? $to.after(targetDepth) : to,
                              new Slice(closeFragment(slice.content, 0, slice.openStart, openDepth),
                                        openDepth, slice.openEnd)) }
      }
    }
    var startSteps = this.steps.length;
    for (var i$2 = targetDepths.length - 1; i$2 >= 0; i$2--) {
      this.replace(from, to, slice);
      if (this.steps.length > startSteps) { break }
      var depth = targetDepths[i$2];
      if (depth < 0) { continue }
      from = $from.before(depth); to = $to.after(depth);
    }
    return this
  };
  function closeFragment(fragment, depth, oldOpen, newOpen, parent) {
    if (depth < oldOpen) {
      var first = fragment.firstChild;
      fragment = fragment.replaceChild(0, first.copy(closeFragment(first.content, depth + 1, oldOpen, newOpen, first)));
    }
    if (depth > newOpen) {
      var match = parent.contentMatchAt(0);
      var start = match.fillBefore(fragment).append(fragment);
      fragment = start.append(match.matchFragment(start).fillBefore(Fragment.empty, true));
    }
    return fragment
  }
  Transform.prototype.replaceRangeWith = function(from, to, node) {
    if (!node.isInline && from == to && this.doc.resolve(from).parent.content.size) {
      var point = insertPoint(this.doc, from, node.type);
      if (point != null) { from = to = point; }
    }
    return this.replaceRange(from, to, new Slice(Fragment.from(node), 0, 0))
  };
  Transform.prototype.deleteRange = function(from, to) {
    var $from = this.doc.resolve(from), $to = this.doc.resolve(to);
    var covered = coveredDepths($from, $to);
    for (var i = 0; i < covered.length; i++) {
      var depth = covered[i], last = i == covered.length - 1;
      if ((last && depth == 0) || $from.node(depth).type.contentMatch.validEnd)
        { return this.delete($from.start(depth), $to.end(depth)) }
      if (depth > 0 && (last || $from.node(depth - 1).canReplace($from.index(depth - 1), $to.indexAfter(depth - 1))))
        { return this.delete($from.before(depth), $to.after(depth)) }
    }
    for (var d = 1; d <= $from.depth && d <= $to.depth; d++) {
      if (from - $from.start(d) == $from.depth - d && to > $from.end(d) && $to.end(d) - to != $to.depth - d)
        { return this.delete($from.before(d), to) }
    }
    return this.delete(from, to)
  };
  function coveredDepths($from, $to) {
    var result = [], minDepth = Math.min($from.depth, $to.depth);
    for (var d = minDepth; d >= 0; d--) {
      var start = $from.start(d);
      if (start < $from.pos - ($from.depth - d) ||
          $to.end(d) > $to.pos + ($to.depth - d) ||
          $from.node(d).type.spec.isolating ||
          $to.node(d).type.spec.isolating) { break }
      if (start == $to.start(d) ||
          (d == $from.depth && d == $to.depth && $from.parent.inlineContent && $to.parent.inlineContent &&
           d && $to.start(d - 1) == start - 1))
        { result.push(d); }
    }
    return result
  }

  var classesById = Object.create(null);
  var Selection = function Selection($anchor, $head, ranges) {
    this.ranges = ranges || [new SelectionRange($anchor.min($head), $anchor.max($head))];
    this.$anchor = $anchor;
    this.$head = $head;
  };
  var prototypeAccessors$3 = { anchor: { configurable: true },head: { configurable: true },from: { configurable: true },to: { configurable: true },$from: { configurable: true },$to: { configurable: true },empty: { configurable: true } };
  prototypeAccessors$3.anchor.get = function () { return this.$anchor.pos };
  prototypeAccessors$3.head.get = function () { return this.$head.pos };
  prototypeAccessors$3.from.get = function () { return this.$from.pos };
  prototypeAccessors$3.to.get = function () { return this.$to.pos };
  prototypeAccessors$3.$from.get = function () {
    return this.ranges[0].$from
  };
  prototypeAccessors$3.$to.get = function () {
    return this.ranges[0].$to
  };
  prototypeAccessors$3.empty.get = function () {
    var ranges = this.ranges;
    for (var i = 0; i < ranges.length; i++)
      { if (ranges[i].$from.pos != ranges[i].$to.pos) { return false } }
    return true
  };
  Selection.prototype.content = function content () {
    return this.$from.node(0).slice(this.from, this.to, true)
  };
  Selection.prototype.replace = function replace (tr, content) {
      if ( content === void 0 ) content = Slice.empty;
    var lastNode = content.content.lastChild, lastParent = null;
    for (var i = 0; i < content.openEnd; i++) {
      lastParent = lastNode;
      lastNode = lastNode.lastChild;
    }
    var mapFrom = tr.steps.length, ranges = this.ranges;
    for (var i$1 = 0; i$1 < ranges.length; i$1++) {
      var ref = ranges[i$1];
        var $from = ref.$from;
        var $to = ref.$to;
        var mapping = tr.mapping.slice(mapFrom);
      tr.replaceRange(mapping.map($from.pos), mapping.map($to.pos), i$1 ? Slice.empty : content);
      if (i$1 == 0)
        { selectionToInsertionEnd$1(tr, mapFrom, (lastNode ? lastNode.isInline : lastParent && lastParent.isTextblock) ? -1 : 1); }
    }
  };
  Selection.prototype.replaceWith = function replaceWith (tr, node) {
    var mapFrom = tr.steps.length, ranges = this.ranges;
    for (var i = 0; i < ranges.length; i++) {
      var ref = ranges[i];
        var $from = ref.$from;
        var $to = ref.$to;
        var mapping = tr.mapping.slice(mapFrom);
      var from = mapping.map($from.pos), to = mapping.map($to.pos);
      if (i) {
        tr.deleteRange(from, to);
      } else {
        tr.replaceRangeWith(from, to, node);
        selectionToInsertionEnd$1(tr, mapFrom, node.isInline ? -1 : 1);
      }
    }
  };
  Selection.findFrom = function findFrom ($pos, dir, textOnly) {
    var inner = $pos.parent.inlineContent ? new TextSelection($pos)
        : findSelectionIn($pos.node(0), $pos.parent, $pos.pos, $pos.index(), dir, textOnly);
    if (inner) { return inner }
    for (var depth = $pos.depth - 1; depth >= 0; depth--) {
      var found = dir < 0
          ? findSelectionIn($pos.node(0), $pos.node(depth), $pos.before(depth + 1), $pos.index(depth), dir, textOnly)
          : findSelectionIn($pos.node(0), $pos.node(depth), $pos.after(depth + 1), $pos.index(depth) + 1, dir, textOnly);
      if (found) { return found }
    }
  };
  Selection.near = function near ($pos, bias) {
      if ( bias === void 0 ) bias = 1;
    return this.findFrom($pos, bias) || this.findFrom($pos, -bias) || new AllSelection($pos.node(0))
  };
  Selection.atStart = function atStart (doc) {
    return findSelectionIn(doc, doc, 0, 0, 1) || new AllSelection(doc)
  };
  Selection.atEnd = function atEnd (doc) {
    return findSelectionIn(doc, doc, doc.content.size, doc.childCount, -1) || new AllSelection(doc)
  };
  Selection.fromJSON = function fromJSON (doc, json) {
    if (!json || !json.type) { throw new RangeError("Invalid input for Selection.fromJSON") }
    var cls = classesById[json.type];
    if (!cls) { throw new RangeError(("No selection type " + (json.type) + " defined")) }
    return cls.fromJSON(doc, json)
  };
  Selection.jsonID = function jsonID (id, selectionClass) {
    if (id in classesById) { throw new RangeError("Duplicate use of selection JSON ID " + id) }
    classesById[id] = selectionClass;
    selectionClass.prototype.jsonID = id;
    return selectionClass
  };
  Selection.prototype.getBookmark = function getBookmark () {
    return TextSelection.between(this.$anchor, this.$head).getBookmark()
  };
  Object.defineProperties( Selection.prototype, prototypeAccessors$3 );
  Selection.prototype.visible = true;
  var SelectionRange = function SelectionRange($from, $to) {
    this.$from = $from;
    this.$to = $to;
  };
  var TextSelection = (function (Selection) {
    function TextSelection($anchor, $head) {
      if ( $head === void 0 ) $head = $anchor;
      Selection.call(this, $anchor, $head);
    }
    if ( Selection ) TextSelection.__proto__ = Selection;
    TextSelection.prototype = Object.create( Selection && Selection.prototype );
    TextSelection.prototype.constructor = TextSelection;
    var prototypeAccessors$1 = { $cursor: { configurable: true } };
    prototypeAccessors$1.$cursor.get = function () { return this.$anchor.pos == this.$head.pos ? this.$head : null };
    TextSelection.prototype.map = function map (doc, mapping) {
      var $head = doc.resolve(mapping.map(this.head));
      if (!$head.parent.inlineContent) { return Selection.near($head) }
      var $anchor = doc.resolve(mapping.map(this.anchor));
      return new TextSelection($anchor.parent.inlineContent ? $anchor : $head, $head)
    };
    TextSelection.prototype.replace = function replace (tr, content) {
      if ( content === void 0 ) content = Slice.empty;
      Selection.prototype.replace.call(this, tr, content);
      if (content == Slice.empty) {
        var marks = this.$from.marksAcross(this.$to);
        if (marks) { tr.ensureMarks(marks); }
      }
    };
    TextSelection.prototype.eq = function eq (other) {
      return other instanceof TextSelection && other.anchor == this.anchor && other.head == this.head
    };
    TextSelection.prototype.getBookmark = function getBookmark () {
      return new TextBookmark(this.anchor, this.head)
    };
    TextSelection.prototype.toJSON = function toJSON () {
      return {type: "text", anchor: this.anchor, head: this.head}
    };
    TextSelection.fromJSON = function fromJSON (doc, json) {
      if (typeof json.anchor != "number" || typeof json.head != "number")
        { throw new RangeError("Invalid input for TextSelection.fromJSON") }
      return new TextSelection(doc.resolve(json.anchor), doc.resolve(json.head))
    };
    TextSelection.create = function create (doc, anchor, head) {
      if ( head === void 0 ) head = anchor;
      var $anchor = doc.resolve(anchor);
      return new this($anchor, head == anchor ? $anchor : doc.resolve(head))
    };
    TextSelection.between = function between ($anchor, $head, bias) {
      var dPos = $anchor.pos - $head.pos;
      if (!bias || dPos) { bias = dPos >= 0 ? 1 : -1; }
      if (!$head.parent.inlineContent) {
        var found = Selection.findFrom($head, bias, true) || Selection.findFrom($head, -bias, true);
        if (found) { $head = found.$head; }
        else { return Selection.near($head, bias) }
      }
      if (!$anchor.parent.inlineContent) {
        if (dPos == 0) {
          $anchor = $head;
        } else {
          $anchor = (Selection.findFrom($anchor, -bias, true) || Selection.findFrom($anchor, bias, true)).$anchor;
          if (($anchor.pos < $head.pos) != (dPos < 0)) { $anchor = $head; }
        }
      }
      return new TextSelection($anchor, $head)
    };
    Object.defineProperties( TextSelection.prototype, prototypeAccessors$1 );
    return TextSelection;
  }(Selection));
  Selection.jsonID("text", TextSelection);
  var TextBookmark = function TextBookmark(anchor, head) {
    this.anchor = anchor;
    this.head = head;
  };
  TextBookmark.prototype.map = function map (mapping) {
    return new TextBookmark(mapping.map(this.anchor), mapping.map(this.head))
  };
  TextBookmark.prototype.resolve = function resolve (doc) {
    return TextSelection.between(doc.resolve(this.anchor), doc.resolve(this.head))
  };
  var NodeSelection = (function (Selection) {
    function NodeSelection($pos) {
      var node = $pos.nodeAfter;
      var $end = $pos.node(0).resolve($pos.pos + node.nodeSize);
      Selection.call(this, $pos, $end);
      this.node = node;
    }
    if ( Selection ) NodeSelection.__proto__ = Selection;
    NodeSelection.prototype = Object.create( Selection && Selection.prototype );
    NodeSelection.prototype.constructor = NodeSelection;
    NodeSelection.prototype.map = function map (doc, mapping) {
      var ref = mapping.mapResult(this.anchor);
      var deleted = ref.deleted;
      var pos = ref.pos;
      var $pos = doc.resolve(pos);
      if (deleted) { return Selection.near($pos) }
      return new NodeSelection($pos)
    };
    NodeSelection.prototype.content = function content () {
      return new Slice(Fragment.from(this.node), 0, 0)
    };
    NodeSelection.prototype.eq = function eq (other) {
      return other instanceof NodeSelection && other.anchor == this.anchor
    };
    NodeSelection.prototype.toJSON = function toJSON () {
      return {type: "node", anchor: this.anchor}
    };
    NodeSelection.prototype.getBookmark = function getBookmark () { return new NodeBookmark(this.anchor) };
    NodeSelection.fromJSON = function fromJSON (doc, json) {
      if (typeof json.anchor != "number")
        { throw new RangeError("Invalid input for NodeSelection.fromJSON") }
      return new NodeSelection(doc.resolve(json.anchor))
    };
    NodeSelection.create = function create (doc, from) {
      return new this(doc.resolve(from))
    };
    NodeSelection.isSelectable = function isSelectable (node) {
      return !node.isText && node.type.spec.selectable !== false
    };
    return NodeSelection;
  }(Selection));
  NodeSelection.prototype.visible = false;
  Selection.jsonID("node", NodeSelection);
  var NodeBookmark = function NodeBookmark(anchor) {
    this.anchor = anchor;
  };
  NodeBookmark.prototype.map = function map (mapping) {
    var ref = mapping.mapResult(this.anchor);
      var deleted = ref.deleted;
      var pos = ref.pos;
    return deleted ? new TextBookmark(pos, pos) : new NodeBookmark(pos)
  };
  NodeBookmark.prototype.resolve = function resolve (doc) {
    var $pos = doc.resolve(this.anchor), node = $pos.nodeAfter;
    if (node && NodeSelection.isSelectable(node)) { return new NodeSelection($pos) }
    return Selection.near($pos)
  };
  var AllSelection = (function (Selection) {
    function AllSelection(doc) {
      Selection.call(this, doc.resolve(0), doc.resolve(doc.content.size));
    }
    if ( Selection ) AllSelection.__proto__ = Selection;
    AllSelection.prototype = Object.create( Selection && Selection.prototype );
    AllSelection.prototype.constructor = AllSelection;
    AllSelection.prototype.replace = function replace (tr, content) {
      if ( content === void 0 ) content = Slice.empty;
      if (content == Slice.empty) {
        tr.delete(0, tr.doc.content.size);
        var sel = Selection.atStart(tr.doc);
        if (!sel.eq(tr.selection)) { tr.setSelection(sel); }
      } else {
        Selection.prototype.replace.call(this, tr, content);
      }
    };
    AllSelection.prototype.toJSON = function toJSON () { return {type: "all"} };
    AllSelection.fromJSON = function fromJSON (doc) { return new AllSelection(doc) };
    AllSelection.prototype.map = function map (doc) { return new AllSelection(doc) };
    AllSelection.prototype.eq = function eq (other) { return other instanceof AllSelection };
    AllSelection.prototype.getBookmark = function getBookmark () { return AllBookmark };
    return AllSelection;
  }(Selection));
  Selection.jsonID("all", AllSelection);
  var AllBookmark = {
    map: function map() { return this },
    resolve: function resolve(doc) { return new AllSelection(doc) }
  };
  function findSelectionIn(doc, node, pos, index, dir, text) {
    if (node.inlineContent) { return TextSelection.create(doc, pos) }
    for (var i = index - (dir > 0 ? 0 : 1); dir > 0 ? i < node.childCount : i >= 0; i += dir) {
      var child = node.child(i);
      if (!child.isAtom) {
        var inner = findSelectionIn(doc, child, pos + dir, dir < 0 ? child.childCount : 0, dir, text);
        if (inner) { return inner }
      } else if (!text && NodeSelection.isSelectable(child)) {
        return NodeSelection.create(doc, pos - (dir < 0 ? child.nodeSize : 0))
      }
      pos += child.nodeSize * dir;
    }
  }
  function selectionToInsertionEnd$1(tr, startLen, bias) {
    var last = tr.steps.length - 1;
    if (last < startLen) { return }
    var step = tr.steps[last];
    if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep)) { return }
    var map = tr.mapping.maps[last], end;
    map.forEach(function (_from, _to, _newFrom, newTo) { if (end == null) { end = newTo; } });
    tr.setSelection(Selection.near(tr.doc.resolve(end), bias));
  }
  var UPDATED_SEL = 1, UPDATED_MARKS = 2, UPDATED_SCROLL = 4;
  var Transaction = (function (Transform) {
    function Transaction(state) {
      Transform.call(this, state.doc);
      this.time = Date.now();
      this.curSelection = state.selection;
      this.curSelectionFor = 0;
      this.storedMarks = state.storedMarks;
      this.updated = 0;
      this.meta = Object.create(null);
    }
    if ( Transform ) Transaction.__proto__ = Transform;
    Transaction.prototype = Object.create( Transform && Transform.prototype );
    Transaction.prototype.constructor = Transaction;
    var prototypeAccessors = { selection: { configurable: true },selectionSet: { configurable: true },storedMarksSet: { configurable: true },isGeneric: { configurable: true },scrolledIntoView: { configurable: true } };
    prototypeAccessors.selection.get = function () {
      if (this.curSelectionFor < this.steps.length) {
        this.curSelection = this.curSelection.map(this.doc, this.mapping.slice(this.curSelectionFor));
        this.curSelectionFor = this.steps.length;
      }
      return this.curSelection
    };
    Transaction.prototype.setSelection = function setSelection (selection) {
      if (selection.$from.doc != this.doc)
        { throw new RangeError("Selection passed to setSelection must point at the current document") }
      this.curSelection = selection;
      this.curSelectionFor = this.steps.length;
      this.updated = (this.updated | UPDATED_SEL) & ~UPDATED_MARKS;
      this.storedMarks = null;
      return this
    };
    prototypeAccessors.selectionSet.get = function () {
      return (this.updated & UPDATED_SEL) > 0
    };
    Transaction.prototype.setStoredMarks = function setStoredMarks (marks) {
      this.storedMarks = marks;
      this.updated |= UPDATED_MARKS;
      return this
    };
    Transaction.prototype.ensureMarks = function ensureMarks (marks) {
      if (!Mark$1.sameSet(this.storedMarks || this.selection.$from.marks(), marks))
        { this.setStoredMarks(marks); }
      return this
    };
    Transaction.prototype.addStoredMark = function addStoredMark (mark) {
      return this.ensureMarks(mark.addToSet(this.storedMarks || this.selection.$head.marks()))
    };
    Transaction.prototype.removeStoredMark = function removeStoredMark (mark) {
      return this.ensureMarks(mark.removeFromSet(this.storedMarks || this.selection.$head.marks()))
    };
    prototypeAccessors.storedMarksSet.get = function () {
      return (this.updated & UPDATED_MARKS) > 0
    };
    Transaction.prototype.addStep = function addStep (step, doc) {
      Transform.prototype.addStep.call(this, step, doc);
      this.updated = this.updated & ~UPDATED_MARKS;
      this.storedMarks = null;
    };
    Transaction.prototype.setTime = function setTime (time) {
      this.time = time;
      return this
    };
    Transaction.prototype.replaceSelection = function replaceSelection (slice) {
      this.selection.replace(this, slice);
      return this
    };
    Transaction.prototype.replaceSelectionWith = function replaceSelectionWith (node, inheritMarks) {
      var selection = this.selection;
      if (inheritMarks !== false)
        { node = node.mark(this.storedMarks || (selection.empty ? selection.$from.marks() : (selection.$from.marksAcross(selection.$to) || Mark$1.none))); }
      selection.replaceWith(this, node);
      return this
    };
    Transaction.prototype.deleteSelection = function deleteSelection () {
      this.selection.replace(this);
      return this
    };
    Transaction.prototype.insertText = function insertText (text, from, to) {
      if ( to === void 0 ) to = from;
      var schema = this.doc.type.schema;
      if (from == null) {
        if (!text) { return this.deleteSelection() }
        return this.replaceSelectionWith(schema.text(text), true)
      } else {
        if (!text) { return this.deleteRange(from, to) }
        var marks = this.storedMarks;
        if (!marks) {
          var $from = this.doc.resolve(from);
          marks = to == from ? $from.marks() : $from.marksAcross(this.doc.resolve(to));
        }
        this.replaceRangeWith(from, to, schema.text(text, marks));
        if (!this.selection.empty) { this.setSelection(Selection.near(this.selection.$to)); }
        return this
      }
    };
    Transaction.prototype.setMeta = function setMeta (key, value) {
      this.meta[typeof key == "string" ? key : key.key] = value;
      return this
    };
    Transaction.prototype.getMeta = function getMeta (key) {
      return this.meta[typeof key == "string" ? key : key.key]
    };
    prototypeAccessors.isGeneric.get = function () {
      for (var _ in this.meta) { return false }
      return true
    };
    Transaction.prototype.scrollIntoView = function scrollIntoView () {
      this.updated |= UPDATED_SCROLL;
      return this
    };
    prototypeAccessors.scrolledIntoView.get = function () {
      return (this.updated & UPDATED_SCROLL) > 0
    };
    Object.defineProperties( Transaction.prototype, prototypeAccessors );
    return Transaction;
  }(Transform));
  function bind(f, self) {
    return !self || !f ? f : f.bind(self)
  }
  var FieldDesc = function FieldDesc(name, desc, self) {
    this.name = name;
    this.init = bind(desc.init, self);
    this.apply = bind(desc.apply, self);
  };
  var baseFields = [
    new FieldDesc("doc", {
      init: function init(config) { return config.doc || config.schema.topNodeType.createAndFill() },
      apply: function apply(tr) { return tr.doc }
    }),
    new FieldDesc("selection", {
      init: function init(config, instance) { return config.selection || Selection.atStart(instance.doc) },
      apply: function apply(tr) { return tr.selection }
    }),
    new FieldDesc("storedMarks", {
      init: function init(config) { return config.storedMarks || null },
      apply: function apply(tr, _marks, _old, state) { return state.selection.$cursor ? tr.storedMarks : null }
    }),
    new FieldDesc("scrollToSelection", {
      init: function init() { return 0 },
      apply: function apply(tr, prev) { return tr.scrolledIntoView ? prev + 1 : prev }
    })
  ];
  var Configuration = function Configuration(schema, plugins) {
    var this$1$1 = this;
    this.schema = schema;
    this.fields = baseFields.concat();
    this.plugins = [];
    this.pluginsByKey = Object.create(null);
    if (plugins) { plugins.forEach(function (plugin) {
      if (this$1$1.pluginsByKey[plugin.key])
        { throw new RangeError("Adding different instances of a keyed plugin (" + plugin.key + ")") }
      this$1$1.plugins.push(plugin);
      this$1$1.pluginsByKey[plugin.key] = plugin;
      if (plugin.spec.state)
        { this$1$1.fields.push(new FieldDesc(plugin.key, plugin.spec.state, plugin)); }
    }); }
  };
  var EditorState = function EditorState(config) {
    this.config = config;
  };
  var prototypeAccessors$1$1 = { schema: { configurable: true },plugins: { configurable: true },tr: { configurable: true } };
  prototypeAccessors$1$1.schema.get = function () {
    return this.config.schema
  };
  prototypeAccessors$1$1.plugins.get = function () {
    return this.config.plugins
  };
  EditorState.prototype.apply = function apply (tr) {
    return this.applyTransaction(tr).state
  };
  EditorState.prototype.filterTransaction = function filterTransaction (tr, ignore) {
      if ( ignore === void 0 ) ignore = -1;
    for (var i = 0; i < this.config.plugins.length; i++) { if (i != ignore) {
      var plugin = this.config.plugins[i];
      if (plugin.spec.filterTransaction && !plugin.spec.filterTransaction.call(plugin, tr, this))
        { return false }
    } }
    return true
  };
  EditorState.prototype.applyTransaction = function applyTransaction (rootTr) {
    if (!this.filterTransaction(rootTr)) { return {state: this, transactions: []} }
    var trs = [rootTr], newState = this.applyInner(rootTr), seen = null;
     for (;;) {
      var haveNew = false;
      for (var i = 0; i < this.config.plugins.length; i++) {
        var plugin = this.config.plugins[i];
        if (plugin.spec.appendTransaction) {
          var n = seen ? seen[i].n : 0, oldState = seen ? seen[i].state : this;
          var tr = n < trs.length &&
              plugin.spec.appendTransaction.call(plugin, n ? trs.slice(n) : trs, oldState, newState);
          if (tr && newState.filterTransaction(tr, i)) {
            tr.setMeta("appendedTransaction", rootTr);
            if (!seen) {
              seen = [];
              for (var j = 0; j < this.config.plugins.length; j++)
                { seen.push(j < i ? {state: newState, n: trs.length} : {state: this, n: 0}); }
            }
            trs.push(tr);
            newState = newState.applyInner(tr);
            haveNew = true;
          }
          if (seen) { seen[i] = {state: newState, n: trs.length}; }
        }
      }
      if (!haveNew) { return {state: newState, transactions: trs} }
    }
  };
  EditorState.prototype.applyInner = function applyInner (tr) {
    if (!tr.before.eq(this.doc)) { throw new RangeError("Applying a mismatched transaction") }
    var newInstance = new EditorState(this.config), fields = this.config.fields;
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      newInstance[field.name] = field.apply(tr, this[field.name], this, newInstance);
    }
    for (var i$1 = 0; i$1 < applyListeners.length; i$1++) { applyListeners[i$1](this, tr, newInstance); }
    return newInstance
  };
  prototypeAccessors$1$1.tr.get = function () { return new Transaction(this) };
  EditorState.create = function create (config) {
    var $config = new Configuration(config.doc ? config.doc.type.schema : config.schema, config.plugins);
    var instance = new EditorState($config);
    for (var i = 0; i < $config.fields.length; i++)
      { instance[$config.fields[i].name] = $config.fields[i].init(config, instance); }
    return instance
  };
  EditorState.prototype.reconfigure = function reconfigure (config) {
    var $config = new Configuration(this.schema, config.plugins);
    var fields = $config.fields, instance = new EditorState($config);
    for (var i = 0; i < fields.length; i++) {
      var name = fields[i].name;
      instance[name] = this.hasOwnProperty(name) ? this[name] : fields[i].init(config, instance);
    }
    return instance
  };
  EditorState.prototype.toJSON = function toJSON (pluginFields) {
    var result = {doc: this.doc.toJSON(), selection: this.selection.toJSON()};
    if (this.storedMarks) { result.storedMarks = this.storedMarks.map(function (m) { return m.toJSON(); }); }
    if (pluginFields && typeof pluginFields == 'object') { for (var prop in pluginFields) {
      if (prop == "doc" || prop == "selection")
        { throw new RangeError("The JSON fields `doc` and `selection` are reserved") }
      var plugin = pluginFields[prop], state = plugin.spec.state;
      if (state && state.toJSON) { result[prop] = state.toJSON.call(plugin, this[plugin.key]); }
    } }
    return result
  };
  EditorState.fromJSON = function fromJSON (config, json, pluginFields) {
    if (!json) { throw new RangeError("Invalid input for EditorState.fromJSON") }
    if (!config.schema) { throw new RangeError("Required config field 'schema' missing") }
    var $config = new Configuration(config.schema, config.plugins);
    var instance = new EditorState($config);
    $config.fields.forEach(function (field) {
      if (field.name == "doc") {
        instance.doc = Node$1.fromJSON(config.schema, json.doc);
      } else if (field.name == "selection") {
        instance.selection = Selection.fromJSON(instance.doc, json.selection);
      } else if (field.name == "storedMarks") {
        if (json.storedMarks) { instance.storedMarks = json.storedMarks.map(config.schema.markFromJSON); }
      } else {
        if (pluginFields) { for (var prop in pluginFields) {
          var plugin = pluginFields[prop], state = plugin.spec.state;
          if (plugin.key == field.name && state && state.fromJSON &&
              Object.prototype.hasOwnProperty.call(json, prop)) {
            instance[field.name] = state.fromJSON.call(plugin, config, json[prop], instance);
            return
          }
        } }
        instance[field.name] = field.init(config, instance);
      }
    });
    return instance
  };
  EditorState.addApplyListener = function addApplyListener (f) {
    applyListeners.push(f);
  };
  EditorState.removeApplyListener = function removeApplyListener (f) {
    var found = applyListeners.indexOf(f);
    if (found > -1) { applyListeners.splice(found, 1); }
  };
  Object.defineProperties( EditorState.prototype, prototypeAccessors$1$1 );
  var applyListeners = [];
  function bindProps(obj, self, target) {
    for (var prop in obj) {
      var val = obj[prop];
      if (val instanceof Function) { val = val.bind(self); }
      else if (prop == "handleDOMEvents") { val = bindProps(val, self, {}); }
      target[prop] = val;
    }
    return target
  }
  var Plugin = function Plugin(spec) {
    this.props = {};
    if (spec.props) { bindProps(spec.props, this, this.props); }
    this.spec = spec;
    this.key = spec.key ? spec.key.key : createKey("plugin");
  };
  Plugin.prototype.getState = function getState (state) { return state[this.key] };
  var keys = Object.create(null);
  function createKey(name) {
    if (name in keys) { return name + "$" + ++keys[name] }
    keys[name] = 0;
    return name + "$"
  }
  var PluginKey = function PluginKey(name) {
  if ( name === void 0 ) name = "key";
   this.key = createKey(name); };
  PluginKey.prototype.get = function get (state) { return state.config.pluginsByKey[this.key] };
  PluginKey.prototype.getState = function getState (state) { return state[this.key] };

  function deleteSelection$2(state, dispatch) {
    if (state.selection.empty) { return false }
    if (dispatch) { dispatch(state.tr.deleteSelection().scrollIntoView()); }
    return true
  }
  function joinBackward$2(state, dispatch, view) {
    var ref = state.selection;
    var $cursor = ref.$cursor;
    if (!$cursor || (view ? !view.endOfTextblock("backward", state)
                          : $cursor.parentOffset > 0))
      { return false }
    var $cut = findCutBefore($cursor);
    if (!$cut) {
      var range = $cursor.blockRange(), target = range && liftTarget(range);
      if (target == null) { return false }
      if (dispatch) { dispatch(state.tr.lift(range, target).scrollIntoView()); }
      return true
    }
    var before = $cut.nodeBefore;
    if (!before.type.spec.isolating && deleteBarrier(state, $cut, dispatch))
      { return true }
    if ($cursor.parent.content.size == 0 &&
        (textblockAt(before, "end") || NodeSelection.isSelectable(before))) {
      var delStep = replaceStep(state.doc, $cursor.before(), $cursor.after(), Slice.empty);
      if (delStep.slice.size < delStep.to - delStep.from) {
        if (dispatch) {
          var tr = state.tr.step(delStep);
          tr.setSelection(textblockAt(before, "end") ? Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos, -1)), -1)
                          : NodeSelection.create(tr.doc, $cut.pos - before.nodeSize));
          dispatch(tr.scrollIntoView());
        }
        return true
      }
    }
    if (before.isAtom && $cut.depth == $cursor.depth - 1) {
      if (dispatch) { dispatch(state.tr.delete($cut.pos - before.nodeSize, $cut.pos).scrollIntoView()); }
      return true
    }
    return false
  }
  function textblockAt(node, side, only) {
    for (; node; node = (side == "start" ? node.firstChild : node.lastChild)) {
      if (node.isTextblock) { return true }
      if (only && node.childCount != 1) { return false }
    }
    return false
  }
  function selectNodeBackward$2(state, dispatch, view) {
    var ref = state.selection;
    var $head = ref.$head;
    var empty = ref.empty;
    var $cut = $head;
    if (!empty) { return false }
    if ($head.parent.isTextblock) {
      if (view ? !view.endOfTextblock("backward", state) : $head.parentOffset > 0) { return false }
      $cut = findCutBefore($head);
    }
    var node = $cut && $cut.nodeBefore;
    if (!node || !NodeSelection.isSelectable(node)) { return false }
    if (dispatch)
      { dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cut.pos - node.nodeSize)).scrollIntoView()); }
    return true
  }
  function findCutBefore($pos) {
    if (!$pos.parent.type.spec.isolating) { for (var i = $pos.depth - 1; i >= 0; i--) {
      if ($pos.index(i) > 0) { return $pos.doc.resolve($pos.before(i + 1)) }
      if ($pos.node(i).type.spec.isolating) { break }
    } }
    return null
  }
  function joinForward$2(state, dispatch, view) {
    var ref = state.selection;
    var $cursor = ref.$cursor;
    if (!$cursor || (view ? !view.endOfTextblock("forward", state)
                          : $cursor.parentOffset < $cursor.parent.content.size))
      { return false }
    var $cut = findCutAfter($cursor);
    if (!$cut) { return false }
    var after = $cut.nodeAfter;
    if (deleteBarrier(state, $cut, dispatch)) { return true }
    if ($cursor.parent.content.size == 0 &&
        (textblockAt(after, "start") || NodeSelection.isSelectable(after))) {
      var delStep = replaceStep(state.doc, $cursor.before(), $cursor.after(), Slice.empty);
      if (delStep.slice.size < delStep.to - delStep.from) {
        if (dispatch) {
          var tr = state.tr.step(delStep);
          tr.setSelection(textblockAt(after, "start") ? Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos)), 1)
                          : NodeSelection.create(tr.doc, tr.mapping.map($cut.pos)));
          dispatch(tr.scrollIntoView());
        }
        return true
      }
    }
    if (after.isAtom && $cut.depth == $cursor.depth - 1) {
      if (dispatch) { dispatch(state.tr.delete($cut.pos, $cut.pos + after.nodeSize).scrollIntoView()); }
      return true
    }
    return false
  }
  function selectNodeForward$2(state, dispatch, view) {
    var ref = state.selection;
    var $head = ref.$head;
    var empty = ref.empty;
    var $cut = $head;
    if (!empty) { return false }
    if ($head.parent.isTextblock) {
      if (view ? !view.endOfTextblock("forward", state) : $head.parentOffset < $head.parent.content.size)
        { return false }
      $cut = findCutAfter($head);
    }
    var node = $cut && $cut.nodeAfter;
    if (!node || !NodeSelection.isSelectable(node)) { return false }
    if (dispatch)
      { dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cut.pos)).scrollIntoView()); }
    return true
  }
  function findCutAfter($pos) {
    if (!$pos.parent.type.spec.isolating) { for (var i = $pos.depth - 1; i >= 0; i--) {
      var parent = $pos.node(i);
      if ($pos.index(i) + 1 < parent.childCount) { return $pos.doc.resolve($pos.after(i + 1)) }
      if (parent.type.spec.isolating) { break }
    } }
    return null
  }
  function lift$2(state, dispatch) {
    var ref = state.selection;
    var $from = ref.$from;
    var $to = ref.$to;
    var range = $from.blockRange($to), target = range && liftTarget(range);
    if (target == null) { return false }
    if (dispatch) { dispatch(state.tr.lift(range, target).scrollIntoView()); }
    return true
  }
  function newlineInCode$2(state, dispatch) {
    var ref = state.selection;
    var $head = ref.$head;
    var $anchor = ref.$anchor;
    if (!$head.parent.type.spec.code || !$head.sameParent($anchor)) { return false }
    if (dispatch) { dispatch(state.tr.insertText("\n").scrollIntoView()); }
    return true
  }
  function defaultBlockAt$2(match) {
    for (var i = 0; i < match.edgeCount; i++) {
      var ref = match.edge(i);
      var type = ref.type;
      if (type.isTextblock && !type.hasRequiredAttrs()) { return type }
    }
    return null
  }
  function exitCode$2(state, dispatch) {
    var ref = state.selection;
    var $head = ref.$head;
    var $anchor = ref.$anchor;
    if (!$head.parent.type.spec.code || !$head.sameParent($anchor)) { return false }
    var above = $head.node(-1), after = $head.indexAfter(-1), type = defaultBlockAt$2(above.contentMatchAt(after));
    if (!above.canReplaceWith(after, after, type)) { return false }
    if (dispatch) {
      var pos = $head.after(), tr = state.tr.replaceWith(pos, pos, type.createAndFill());
      tr.setSelection(Selection.near(tr.doc.resolve(pos), 1));
      dispatch(tr.scrollIntoView());
    }
    return true
  }
  function createParagraphNear$2(state, dispatch) {
    var sel = state.selection;
    var $from = sel.$from;
    var $to = sel.$to;
    if (sel instanceof AllSelection || $from.parent.inlineContent || $to.parent.inlineContent) { return false }
    var type = defaultBlockAt$2($to.parent.contentMatchAt($to.indexAfter()));
    if (!type || !type.isTextblock) { return false }
    if (dispatch) {
      var side = (!$from.parentOffset && $to.index() < $to.parent.childCount ? $from : $to).pos;
      var tr = state.tr.insert(side, type.createAndFill());
      tr.setSelection(TextSelection.create(tr.doc, side + 1));
      dispatch(tr.scrollIntoView());
    }
    return true
  }
  function liftEmptyBlock$2(state, dispatch) {
    var ref = state.selection;
    var $cursor = ref.$cursor;
    if (!$cursor || $cursor.parent.content.size) { return false }
    if ($cursor.depth > 1 && $cursor.after() != $cursor.end(-1)) {
      var before = $cursor.before();
      if (canSplit(state.doc, before)) {
        if (dispatch) { dispatch(state.tr.split(before).scrollIntoView()); }
        return true
      }
    }
    var range = $cursor.blockRange(), target = range && liftTarget(range);
    if (target == null) { return false }
    if (dispatch) { dispatch(state.tr.lift(range, target).scrollIntoView()); }
    return true
  }
  function splitBlock$2(state, dispatch) {
    var ref = state.selection;
    var $from = ref.$from;
    var $to = ref.$to;
    if (state.selection instanceof NodeSelection && state.selection.node.isBlock) {
      if (!$from.parentOffset || !canSplit(state.doc, $from.pos)) { return false }
      if (dispatch) { dispatch(state.tr.split($from.pos).scrollIntoView()); }
      return true
    }
    if (!$from.parent.isBlock) { return false }
    if (dispatch) {
      var atEnd = $to.parentOffset == $to.parent.content.size;
      var tr = state.tr;
      if (state.selection instanceof TextSelection || state.selection instanceof AllSelection) { tr.deleteSelection(); }
      var deflt = $from.depth == 0 ? null : defaultBlockAt$2($from.node(-1).contentMatchAt($from.indexAfter(-1)));
      var types = atEnd && deflt ? [{type: deflt}] : null;
      var can = canSplit(tr.doc, tr.mapping.map($from.pos), 1, types);
      if (!types && !can && canSplit(tr.doc, tr.mapping.map($from.pos), 1, deflt && [{type: deflt}])) {
        types = [{type: deflt}];
        can = true;
      }
      if (can) {
        tr.split(tr.mapping.map($from.pos), 1, types);
        if (!atEnd && !$from.parentOffset && $from.parent.type != deflt) {
          var first = tr.mapping.map($from.before()), $first = tr.doc.resolve(first);
          if ($from.node(-1).canReplaceWith($first.index(), $first.index() + 1, deflt))
            { tr.setNodeMarkup(tr.mapping.map($from.before()), deflt); }
        }
      }
      dispatch(tr.scrollIntoView());
    }
    return true
  }
  function selectParentNode$2(state, dispatch) {
    var ref = state.selection;
    var $from = ref.$from;
    var to = ref.to;
    var pos;
    var same = $from.sharedDepth(to);
    if (same == 0) { return false }
    pos = $from.before(same);
    if (dispatch) { dispatch(state.tr.setSelection(NodeSelection.create(state.doc, pos))); }
    return true
  }
  function selectAll$2(state, dispatch) {
    if (dispatch) { dispatch(state.tr.setSelection(new AllSelection(state.doc))); }
    return true
  }
  function joinMaybeClear(state, $pos, dispatch) {
    var before = $pos.nodeBefore, after = $pos.nodeAfter, index = $pos.index();
    if (!before || !after || !before.type.compatibleContent(after.type)) { return false }
    if (!before.content.size && $pos.parent.canReplace(index - 1, index)) {
      if (dispatch) { dispatch(state.tr.delete($pos.pos - before.nodeSize, $pos.pos).scrollIntoView()); }
      return true
    }
    if (!$pos.parent.canReplace(index, index + 1) || !(after.isTextblock || canJoin(state.doc, $pos.pos)))
      { return false }
    if (dispatch)
      { dispatch(state.tr
               .clearIncompatible($pos.pos, before.type, before.contentMatchAt(before.childCount))
               .join($pos.pos)
               .scrollIntoView()); }
    return true
  }
  function deleteBarrier(state, $cut, dispatch) {
    var before = $cut.nodeBefore, after = $cut.nodeAfter, conn, match;
    if (before.type.spec.isolating || after.type.spec.isolating) { return false }
    if (joinMaybeClear(state, $cut, dispatch)) { return true }
    var canDelAfter = $cut.parent.canReplace($cut.index(), $cut.index() + 1);
    if (canDelAfter &&
        (conn = (match = before.contentMatchAt(before.childCount)).findWrapping(after.type)) &&
        match.matchType(conn[0] || after.type).validEnd) {
      if (dispatch) {
        var end = $cut.pos + after.nodeSize, wrap = Fragment.empty;
        for (var i = conn.length - 1; i >= 0; i--)
          { wrap = Fragment.from(conn[i].create(null, wrap)); }
        wrap = Fragment.from(before.copy(wrap));
        var tr = state.tr.step(new ReplaceAroundStep($cut.pos - 1, end, $cut.pos, end, new Slice(wrap, 1, 0), conn.length, true));
        var joinAt = end + 2 * conn.length;
        if (canJoin(tr.doc, joinAt)) { tr.join(joinAt); }
        dispatch(tr.scrollIntoView());
      }
      return true
    }
    var selAfter = Selection.findFrom($cut, 1);
    var range = selAfter && selAfter.$from.blockRange(selAfter.$to), target = range && liftTarget(range);
    if (target != null && target >= $cut.depth) {
      if (dispatch) { dispatch(state.tr.lift(range, target).scrollIntoView()); }
      return true
    }
    if (canDelAfter && textblockAt(after, "start", true) && textblockAt(before, "end")) {
      var at = before, wrap$1 = [];
      for (;;) {
        wrap$1.push(at);
        if (at.isTextblock) { break }
        at = at.lastChild;
      }
      var afterText = after, afterDepth = 1;
      for (; !afterText.isTextblock; afterText = afterText.firstChild) { afterDepth++; }
      if (at.canReplace(at.childCount, at.childCount, afterText.content)) {
        if (dispatch) {
          var end$1 = Fragment.empty;
          for (var i$1 = wrap$1.length - 1; i$1 >= 0; i$1--) { end$1 = Fragment.from(wrap$1[i$1].copy(end$1)); }
          var tr$1 = state.tr.step(new ReplaceAroundStep($cut.pos - wrap$1.length, $cut.pos + after.nodeSize,
                                                       $cut.pos + afterDepth, $cut.pos + after.nodeSize - afterDepth,
                                                       new Slice(end$1, wrap$1.length, 0), 0, true));
          dispatch(tr$1.scrollIntoView());
        }
        return true
      }
    }
    return false
  }
  function selectTextblockSide(side) {
    return function(state, dispatch) {
      var sel = state.selection, $pos = side < 0 ? sel.$from : sel.$to;
      var depth = $pos.depth;
      while ($pos.node(depth).isInline) {
        if (!depth) { return false }
        depth--;
      }
      if (!$pos.node(depth).isTextblock) { return false }
      if (dispatch)
        { dispatch(state.tr.setSelection(TextSelection.create(
          state.doc, side < 0 ? $pos.start(depth) : $pos.end(depth)))); }
      return true
    }
  }
  var selectTextblockStart$2 = selectTextblockSide(-1);
  var selectTextblockEnd$2 = selectTextblockSide(1);
  function wrapIn$2(nodeType, attrs) {
    return function(state, dispatch) {
      var ref = state.selection;
      var $from = ref.$from;
      var $to = ref.$to;
      var range = $from.blockRange($to), wrapping = range && findWrapping(range, nodeType, attrs);
      if (!wrapping) { return false }
      if (dispatch) { dispatch(state.tr.wrap(range, wrapping).scrollIntoView()); }
      return true
    }
  }
  function setBlockType(nodeType, attrs) {
    return function(state, dispatch) {
      var ref = state.selection;
      var from = ref.from;
      var to = ref.to;
      var applicable = false;
      state.doc.nodesBetween(from, to, function (node, pos) {
        if (applicable) { return false }
        if (!node.isTextblock || node.hasMarkup(nodeType, attrs)) { return }
        if (node.type == nodeType) {
          applicable = true;
        } else {
          var $pos = state.doc.resolve(pos), index = $pos.index();
          applicable = $pos.parent.canReplaceWith(index, index + 1, nodeType);
        }
      });
      if (!applicable) { return false }
      if (dispatch) { dispatch(state.tr.setBlockType(from, to, nodeType, attrs).scrollIntoView()); }
      return true
    }
  }
  function chainCommands() {
    var commands = [], len = arguments.length;
    while ( len-- ) commands[ len ] = arguments[ len ];
    return function(state, dispatch, view) {
      for (var i = 0; i < commands.length; i++)
        { if (commands[i](state, dispatch, view)) { return true } }
      return false
    }
  }
  var backspace = chainCommands(deleteSelection$2, joinBackward$2, selectNodeBackward$2);
  var del = chainCommands(deleteSelection$2, joinForward$2, selectNodeForward$2);
  var pcBaseKeymap = {
    "Enter": chainCommands(newlineInCode$2, createParagraphNear$2, liftEmptyBlock$2, splitBlock$2),
    "Mod-Enter": exitCode$2,
    "Backspace": backspace,
    "Mod-Backspace": backspace,
    "Shift-Backspace": backspace,
    "Delete": del,
    "Mod-Delete": del,
    "Mod-a": selectAll$2
  };
  var macBaseKeymap = {
    "Ctrl-h": pcBaseKeymap["Backspace"],
    "Alt-Backspace": pcBaseKeymap["Mod-Backspace"],
    "Ctrl-d": pcBaseKeymap["Delete"],
    "Ctrl-Alt-Backspace": pcBaseKeymap["Mod-Delete"],
    "Alt-Delete": pcBaseKeymap["Mod-Delete"],
    "Alt-d": pcBaseKeymap["Mod-Delete"],
    "Ctrl-a": selectTextblockStart$2,
    "Ctrl-e": selectTextblockEnd$2
  };
  for (var key in pcBaseKeymap) { macBaseKeymap[key] = pcBaseKeymap[key]; }
  pcBaseKeymap.Home = selectTextblockStart$2;
  pcBaseKeymap.End = selectTextblockEnd$2;
  typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform)
            : typeof os != "undefined" ? os.platform() == "darwin" : false;

  function wrapInList$2(listType, attrs) {
    return function(state, dispatch) {
      var ref = state.selection;
      var $from = ref.$from;
      var $to = ref.$to;
      var range = $from.blockRange($to), doJoin = false, outerRange = range;
      if (!range) { return false }
      if (range.depth >= 2 && $from.node(range.depth - 1).type.compatibleContent(listType) && range.startIndex == 0) {
        if ($from.index(range.depth - 1) == 0) { return false }
        var $insert = state.doc.resolve(range.start - 2);
        outerRange = new NodeRange($insert, $insert, range.depth);
        if (range.endIndex < range.parent.childCount)
          { range = new NodeRange($from, state.doc.resolve($to.end(range.depth)), range.depth); }
        doJoin = true;
      }
      var wrap = findWrapping(outerRange, listType, attrs, range);
      if (!wrap) { return false }
      if (dispatch) { dispatch(doWrapInList(state.tr, range, wrap, doJoin, listType).scrollIntoView()); }
      return true
    }
  }
  function doWrapInList(tr, range, wrappers, joinBefore, listType) {
    var content = Fragment.empty;
    for (var i = wrappers.length - 1; i >= 0; i--)
      { content = Fragment.from(wrappers[i].type.create(wrappers[i].attrs, content)); }
    tr.step(new ReplaceAroundStep(range.start - (joinBefore ? 2 : 0), range.end, range.start, range.end,
                                  new Slice(content, 0, 0), wrappers.length, true));
    var found = 0;
    for (var i$1 = 0; i$1 < wrappers.length; i$1++) { if (wrappers[i$1].type == listType) { found = i$1 + 1; } }
    var splitDepth = wrappers.length - found;
    var splitPos = range.start + wrappers.length - (joinBefore ? 2 : 0), parent = range.parent;
    for (var i$2 = range.startIndex, e = range.endIndex, first = true; i$2 < e; i$2++, first = false) {
      if (!first && canSplit(tr.doc, splitPos, splitDepth)) {
        tr.split(splitPos, splitDepth);
        splitPos += 2 * splitDepth;
      }
      splitPos += parent.child(i$2).nodeSize;
    }
    return tr
  }
  function liftListItem$2(itemType) {
    return function(state, dispatch) {
      var ref = state.selection;
      var $from = ref.$from;
      var $to = ref.$to;
      var range = $from.blockRange($to, function (node) { return node.childCount && node.firstChild.type == itemType; });
      if (!range) { return false }
      if (!dispatch) { return true }
      if ($from.node(range.depth - 1).type == itemType)
        { return liftToOuterList(state, dispatch, itemType, range) }
      else
        { return liftOutOfList(state, dispatch, range) }
    }
  }
  function liftToOuterList(state, dispatch, itemType, range) {
    var tr = state.tr, end = range.end, endOfList = range.$to.end(range.depth);
    if (end < endOfList) {
      tr.step(new ReplaceAroundStep(end - 1, endOfList, end, endOfList,
                                    new Slice(Fragment.from(itemType.create(null, range.parent.copy())), 1, 0), 1, true));
      range = new NodeRange(tr.doc.resolve(range.$from.pos), tr.doc.resolve(endOfList), range.depth);
    }
    dispatch(tr.lift(range, liftTarget(range)).scrollIntoView());
    return true
  }
  function liftOutOfList(state, dispatch, range) {
    var tr = state.tr, list = range.parent;
    for (var pos = range.end, i = range.endIndex - 1, e = range.startIndex; i > e; i--) {
      pos -= list.child(i).nodeSize;
      tr.delete(pos - 1, pos + 1);
    }
    var $start = tr.doc.resolve(range.start), item = $start.nodeAfter;
    if (tr.mapping.map(range.end) != range.start + $start.nodeAfter.nodeSize) { return false }
    var atStart = range.startIndex == 0, atEnd = range.endIndex == list.childCount;
    var parent = $start.node(-1), indexBefore = $start.index(-1);
    if (!parent.canReplace(indexBefore + (atStart ? 0 : 1), indexBefore + 1,
                           item.content.append(atEnd ? Fragment.empty : Fragment.from(list))))
      { return false }
    var start = $start.pos, end = start + item.nodeSize;
    tr.step(new ReplaceAroundStep(start - (atStart ? 1 : 0), end + (atEnd ? 1 : 0), start + 1, end - 1,
                                  new Slice((atStart ? Fragment.empty : Fragment.from(list.copy(Fragment.empty)))
                                            .append(atEnd ? Fragment.empty : Fragment.from(list.copy(Fragment.empty))),
                                            atStart ? 0 : 1, atEnd ? 0 : 1), atStart ? 0 : 1));
    dispatch(tr.scrollIntoView());
    return true
  }
  function sinkListItem$2(itemType) {
    return function(state, dispatch) {
      var ref = state.selection;
      var $from = ref.$from;
      var $to = ref.$to;
      var range = $from.blockRange($to, function (node) { return node.childCount && node.firstChild.type == itemType; });
      if (!range) { return false }
      var startIndex = range.startIndex;
      if (startIndex == 0) { return false }
      var parent = range.parent, nodeBefore = parent.child(startIndex - 1);
      if (nodeBefore.type != itemType) { return false }
      if (dispatch) {
        var nestedBefore = nodeBefore.lastChild && nodeBefore.lastChild.type == parent.type;
        var inner = Fragment.from(nestedBefore ? itemType.create() : null);
        var slice = new Slice(Fragment.from(itemType.create(null, Fragment.from(parent.type.create(null, inner)))),
                              nestedBefore ? 3 : 1, 0);
        var before = range.start, after = range.end;
        dispatch(state.tr.step(new ReplaceAroundStep(before - (nestedBefore ? 3 : 1), after,
                                                     before, after, slice, 1, true))
                 .scrollIntoView());
      }
      return true
    }
  }

  var result = {};
  if (typeof navigator != "undefined" && typeof document != "undefined") {
    var ie_edge = /Edge\/(\d+)/.exec(navigator.userAgent);
    var ie_upto10 = /MSIE \d/.test(navigator.userAgent);
    var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);
    var ie$1 = result.ie = !!(ie_upto10 || ie_11up || ie_edge);
    result.ie_version = ie_upto10 ? document.documentMode || 6 : ie_11up ? +ie_11up[1] : ie_edge ? +ie_edge[1] : null;
    result.gecko = !ie$1 && /gecko\/(\d+)/i.test(navigator.userAgent);
    result.gecko_version = result.gecko && +(/Firefox\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1];
    var chrome$1 = !ie$1 && /Chrome\/(\d+)/.exec(navigator.userAgent);
    result.chrome = !!chrome$1;
    result.chrome_version = chrome$1 && +chrome$1[1];
    result.safari = !ie$1 && /Apple Computer/.test(navigator.vendor);
    result.ios = result.safari && (/Mobile\/\w+/.test(navigator.userAgent) || navigator.maxTouchPoints > 2);
    result.mac = result.ios || /Mac/.test(navigator.platform);
    result.android = /Android \d/.test(navigator.userAgent);
    result.webkit = "webkitFontSmoothing" in document.documentElement.style;
    result.webkit_version = result.webkit && +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1];
  }
  var domIndex = function(node) {
    for (var index = 0;; index++) {
      node = node.previousSibling;
      if (!node) { return index }
    }
  };
  var parentNode = function(node) {
    var parent = node.assignedSlot || node.parentNode;
    return parent && parent.nodeType == 11 ? parent.host : parent
  };
  var reusedRange = null;
  var textRange = function(node, from, to) {
    var range = reusedRange || (reusedRange = document.createRange());
    range.setEnd(node, to == null ? node.nodeValue.length : to);
    range.setStart(node, from || 0);
    return range
  };
  var isEquivalentPosition = function(node, off, targetNode, targetOff) {
    return targetNode && (scanFor(node, off, targetNode, targetOff, -1) ||
                          scanFor(node, off, targetNode, targetOff, 1))
  };
  var atomElements = /^(img|br|input|textarea|hr)$/i;
  function scanFor(node, off, targetNode, targetOff, dir) {
    for (;;) {
      if (node == targetNode && off == targetOff) { return true }
      if (off == (dir < 0 ? 0 : nodeSize(node))) {
        var parent = node.parentNode;
        if (!parent || parent.nodeType != 1 || hasBlockDesc(node) || atomElements.test(node.nodeName) ||
            node.contentEditable == "false")
          { return false }
        off = domIndex(node) + (dir < 0 ? 0 : 1);
        node = parent;
      } else if (node.nodeType == 1) {
        node = node.childNodes[off + (dir < 0 ? -1 : 0)];
        if (node.contentEditable == "false") { return false }
        off = dir < 0 ? nodeSize(node) : 0;
      } else {
        return false
      }
    }
  }
  function nodeSize(node) {
    return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length
  }
  function isOnEdge(node, offset, parent) {
    for (var atStart = offset == 0, atEnd = offset == nodeSize(node); atStart || atEnd;) {
      if (node == parent) { return true }
      var index = domIndex(node);
      node = node.parentNode;
      if (!node) { return false }
      atStart = atStart && index == 0;
      atEnd = atEnd && index == nodeSize(node);
    }
  }
  function hasBlockDesc(dom) {
    var desc;
    for (var cur = dom; cur; cur = cur.parentNode) { if (desc = cur.pmViewDesc) { break } }
    return desc && desc.node && desc.node.isBlock && (desc.dom == dom || desc.contentDOM == dom)
  }
  var selectionCollapsed = function(domSel) {
    var collapsed = domSel.isCollapsed;
    if (collapsed && result.chrome && domSel.rangeCount && !domSel.getRangeAt(0).collapsed)
      { collapsed = false; }
    return collapsed
  };
  function keyEvent(keyCode, key) {
    var event = document.createEvent("Event");
    event.initEvent("keydown", true, true);
    event.keyCode = keyCode;
    event.key = event.code = key;
    return event
  }
  function windowRect(doc) {
    return {left: 0, right: doc.documentElement.clientWidth,
            top: 0, bottom: doc.documentElement.clientHeight}
  }
  function getSide(value, side) {
    return typeof value == "number" ? value : value[side]
  }
  function clientRect(node) {
    var rect = node.getBoundingClientRect();
    var scaleX = (rect.width / node.offsetWidth) || 1;
    var scaleY = (rect.height / node.offsetHeight) || 1;
    return {left: rect.left, right: rect.left + node.clientWidth * scaleX,
            top: rect.top, bottom: rect.top + node.clientHeight * scaleY}
  }
  function scrollRectIntoView(view, rect, startDOM) {
    var scrollThreshold = view.someProp("scrollThreshold") || 0, scrollMargin = view.someProp("scrollMargin") || 5;
    var doc = view.dom.ownerDocument;
    for (var parent = startDOM || view.dom;; parent = parentNode(parent)) {
      if (!parent) { break }
      if (parent.nodeType != 1) { continue }
      var atTop = parent == doc.body || parent.nodeType != 1;
      var bounding = atTop ? windowRect(doc) : clientRect(parent);
      var moveX = 0, moveY = 0;
      if (rect.top < bounding.top + getSide(scrollThreshold, "top"))
        { moveY = -(bounding.top - rect.top + getSide(scrollMargin, "top")); }
      else if (rect.bottom > bounding.bottom - getSide(scrollThreshold, "bottom"))
        { moveY = rect.bottom - bounding.bottom + getSide(scrollMargin, "bottom"); }
      if (rect.left < bounding.left + getSide(scrollThreshold, "left"))
        { moveX = -(bounding.left - rect.left + getSide(scrollMargin, "left")); }
      else if (rect.right > bounding.right - getSide(scrollThreshold, "right"))
        { moveX = rect.right - bounding.right + getSide(scrollMargin, "right"); }
      if (moveX || moveY) {
        if (atTop) {
          doc.defaultView.scrollBy(moveX, moveY);
        } else {
          var startX = parent.scrollLeft, startY = parent.scrollTop;
          if (moveY) { parent.scrollTop += moveY; }
          if (moveX) { parent.scrollLeft += moveX; }
          var dX = parent.scrollLeft - startX, dY = parent.scrollTop - startY;
          rect = {left: rect.left - dX, top: rect.top - dY, right: rect.right - dX, bottom: rect.bottom - dY};
        }
      }
      if (atTop) { break }
    }
  }
  function storeScrollPos(view) {
    var rect = view.dom.getBoundingClientRect(), startY = Math.max(0, rect.top);
    var refDOM, refTop;
    for (var x = (rect.left + rect.right) / 2, y = startY + 1;
         y < Math.min(innerHeight, rect.bottom); y += 5) {
      var dom = view.root.elementFromPoint(x, y);
      if (dom == view.dom || !view.dom.contains(dom)) { continue }
      var localRect = dom.getBoundingClientRect();
      if (localRect.top >= startY - 20) {
        refDOM = dom;
        refTop = localRect.top;
        break
      }
    }
    return {refDOM: refDOM, refTop: refTop, stack: scrollStack(view.dom)}
  }
  function scrollStack(dom) {
    var stack = [], doc = dom.ownerDocument;
    for (; dom; dom = parentNode(dom)) {
      stack.push({dom: dom, top: dom.scrollTop, left: dom.scrollLeft});
      if (dom == doc) { break }
    }
    return stack
  }
  function resetScrollPos(ref) {
    var refDOM = ref.refDOM;
    var refTop = ref.refTop;
    var stack = ref.stack;
    var newRefTop = refDOM ? refDOM.getBoundingClientRect().top : 0;
    restoreScrollStack(stack, newRefTop == 0 ? 0 : newRefTop - refTop);
  }
  function restoreScrollStack(stack, dTop) {
    for (var i = 0; i < stack.length; i++) {
      var ref = stack[i];
      var dom = ref.dom;
      var top = ref.top;
      var left = ref.left;
      if (dom.scrollTop != top + dTop) { dom.scrollTop = top + dTop; }
      if (dom.scrollLeft != left) { dom.scrollLeft = left; }
    }
  }
  var preventScrollSupported = null;
  function focusPreventScroll(dom) {
    if (dom.setActive) { return dom.setActive() }
    if (preventScrollSupported) { return dom.focus(preventScrollSupported) }
    var stored = scrollStack(dom);
    dom.focus(preventScrollSupported == null ? {
      get preventScroll() {
        preventScrollSupported = {preventScroll: true};
        return true
      }
    } : undefined);
    if (!preventScrollSupported) {
      preventScrollSupported = false;
      restoreScrollStack(stored, 0);
    }
  }
  function findOffsetInNode(node, coords) {
    var closest, dxClosest = 2e8, coordsClosest, offset = 0;
    var rowBot = coords.top, rowTop = coords.top;
    for (var child = node.firstChild, childIndex = 0; child; child = child.nextSibling, childIndex++) {
      var rects = (void 0);
      if (child.nodeType == 1) { rects = child.getClientRects(); }
      else if (child.nodeType == 3) { rects = textRange(child).getClientRects(); }
      else { continue }
      for (var i = 0; i < rects.length; i++) {
        var rect = rects[i];
        if (rect.top <= rowBot && rect.bottom >= rowTop) {
          rowBot = Math.max(rect.bottom, rowBot);
          rowTop = Math.min(rect.top, rowTop);
          var dx = rect.left > coords.left ? rect.left - coords.left
              : rect.right < coords.left ? coords.left - rect.right : 0;
          if (dx < dxClosest) {
            closest = child;
            dxClosest = dx;
            coordsClosest = dx && closest.nodeType == 3 ? {left: rect.right < coords.left ? rect.right : rect.left, top: coords.top} : coords;
            if (child.nodeType == 1 && dx)
              { offset = childIndex + (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0); }
            continue
          }
        }
        if (!closest && (coords.left >= rect.right && coords.top >= rect.top ||
                         coords.left >= rect.left && coords.top >= rect.bottom))
          { offset = childIndex + 1; }
      }
    }
    if (closest && closest.nodeType == 3) { return findOffsetInText(closest, coordsClosest) }
    if (!closest || (dxClosest && closest.nodeType == 1)) { return {node: node, offset: offset} }
    return findOffsetInNode(closest, coordsClosest)
  }
  function findOffsetInText(node, coords) {
    var len = node.nodeValue.length;
    var range = document.createRange();
    for (var i = 0; i < len; i++) {
      range.setEnd(node, i + 1);
      range.setStart(node, i);
      var rect = singleRect(range, 1);
      if (rect.top == rect.bottom) { continue }
      if (inRect(coords, rect))
        { return {node: node, offset: i + (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0)} }
    }
    return {node: node, offset: 0}
  }
  function inRect(coords, rect) {
    return coords.left >= rect.left - 1 && coords.left <= rect.right + 1&&
      coords.top >= rect.top - 1 && coords.top <= rect.bottom + 1
  }
  function targetKludge(dom, coords) {
    var parent = dom.parentNode;
    if (parent && /^li$/i.test(parent.nodeName) && coords.left < dom.getBoundingClientRect().left)
      { return parent }
    return dom
  }
  function posFromElement(view, elt, coords) {
    var ref = findOffsetInNode(elt, coords);
    var node = ref.node;
    var offset = ref.offset;
    var bias = -1;
    if (node.nodeType == 1 && !node.firstChild) {
      var rect = node.getBoundingClientRect();
      bias = rect.left != rect.right && coords.left > (rect.left + rect.right) / 2 ? 1 : -1;
    }
    return view.docView.posFromDOM(node, offset, bias)
  }
  function posFromCaret(view, node, offset, coords) {
    var outside = -1;
    for (var cur = node;;) {
      if (cur == view.dom) { break }
      var desc = view.docView.nearestDesc(cur, true);
      if (!desc) { return null }
      if (desc.node.isBlock && desc.parent) {
        var rect = desc.dom.getBoundingClientRect();
        if (rect.left > coords.left || rect.top > coords.top) { outside = desc.posBefore; }
        else if (rect.right < coords.left || rect.bottom < coords.top) { outside = desc.posAfter; }
        else { break }
      }
      cur = desc.dom.parentNode;
    }
    return outside > -1 ? outside : view.docView.posFromDOM(node, offset)
  }
  function elementFromPoint(element, coords, box) {
    var len = element.childNodes.length;
    if (len && box.top < box.bottom) {
      for (var startI = Math.max(0, Math.min(len - 1, Math.floor(len * (coords.top - box.top) / (box.bottom - box.top)) - 2)), i = startI;;) {
        var child = element.childNodes[i];
        if (child.nodeType == 1) {
          var rects = child.getClientRects();
          for (var j = 0; j < rects.length; j++) {
            var rect = rects[j];
            if (inRect(coords, rect)) { return elementFromPoint(child, coords, rect) }
          }
        }
        if ((i = (i + 1) % len) == startI) { break }
      }
    }
    return element
  }
  function posAtCoords(view, coords) {
    var assign, assign$1;
    var doc = view.dom.ownerDocument, node, offset;
    if (doc.caretPositionFromPoint) {
      try {
        var pos$1 = doc.caretPositionFromPoint(coords.left, coords.top);
        if (pos$1) { ((assign = pos$1, node = assign.offsetNode, offset = assign.offset)); }
      } catch (_) {}
    }
    if (!node && doc.caretRangeFromPoint) {
      var range = doc.caretRangeFromPoint(coords.left, coords.top);
      if (range) { ((assign$1 = range, node = assign$1.startContainer, offset = assign$1.startOffset)); }
    }
    var elt = (view.root.elementFromPoint ? view.root : doc).elementFromPoint(coords.left, coords.top + 1), pos;
    if (!elt || !view.dom.contains(elt.nodeType != 1 ? elt.parentNode : elt)) {
      var box = view.dom.getBoundingClientRect();
      if (!inRect(coords, box)) { return null }
      elt = elementFromPoint(view.dom, coords, box);
      if (!elt) { return null }
    }
    if (result.safari) {
      for (var p = elt; node && p; p = parentNode(p))
        { if (p.draggable) { node = offset = null; } }
    }
    elt = targetKludge(elt, coords);
    if (node) {
      if (result.gecko && node.nodeType == 1) {
        offset = Math.min(offset, node.childNodes.length);
        if (offset < node.childNodes.length) {
          var next = node.childNodes[offset], box$1;
          if (next.nodeName == "IMG" && (box$1 = next.getBoundingClientRect()).right <= coords.left &&
              box$1.bottom > coords.top)
            { offset++; }
        }
      }
      if (node == view.dom && offset == node.childNodes.length - 1 && node.lastChild.nodeType == 1 &&
          coords.top > node.lastChild.getBoundingClientRect().bottom)
        { pos = view.state.doc.content.size; }
      else if (offset == 0 || node.nodeType != 1 || node.childNodes[offset - 1].nodeName != "BR")
        { pos = posFromCaret(view, node, offset, coords); }
    }
    if (pos == null) { pos = posFromElement(view, elt, coords); }
    var desc = view.docView.nearestDesc(elt, true);
    return {pos: pos, inside: desc ? desc.posAtStart - desc.border : -1}
  }
  function singleRect(object, bias) {
    var rects = object.getClientRects();
    return !rects.length ? object.getBoundingClientRect() : rects[bias < 0 ? 0 : rects.length - 1]
  }
  var BIDI = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
  function coordsAtPos(view, pos, side) {
    var ref = view.docView.domFromPos(pos, side < 0 ? -1 : 1);
    var node = ref.node;
    var offset = ref.offset;
    var supportEmptyRange = result.webkit || result.gecko;
    if (node.nodeType == 3) {
      if (supportEmptyRange && (BIDI.test(node.nodeValue) || (side < 0 ? !offset : offset == node.nodeValue.length))) {
        var rect = singleRect(textRange(node, offset, offset), side);
        if (result.gecko && offset && /\s/.test(node.nodeValue[offset - 1]) && offset < node.nodeValue.length) {
          var rectBefore = singleRect(textRange(node, offset - 1, offset - 1), -1);
          if (rectBefore.top == rect.top) {
            var rectAfter = singleRect(textRange(node, offset, offset + 1), -1);
            if (rectAfter.top != rect.top)
              { return flattenV(rectAfter, rectAfter.left < rectBefore.left) }
          }
        }
        return rect
      } else {
        var from = offset, to = offset, takeSide = side < 0 ? 1 : -1;
        if (side < 0 && !offset) { to++; takeSide = -1; }
        else if (side >= 0 && offset == node.nodeValue.length) { from--; takeSide = 1; }
        else if (side < 0) { from--; }
        else { to ++; }
        return flattenV(singleRect(textRange(node, from, to), takeSide), takeSide < 0)
      }
    }
    if (!view.state.doc.resolve(pos).parent.inlineContent) {
      if (offset && (side < 0 || offset == nodeSize(node))) {
        var before = node.childNodes[offset - 1];
        if (before.nodeType == 1) { return flattenH(before.getBoundingClientRect(), false) }
      }
      if (offset < nodeSize(node)) {
        var after = node.childNodes[offset];
        if (after.nodeType == 1) { return flattenH(after.getBoundingClientRect(), true) }
      }
      return flattenH(node.getBoundingClientRect(), side >= 0)
    }
    if (offset && (side < 0 || offset == nodeSize(node))) {
      var before$1 = node.childNodes[offset - 1];
      var target = before$1.nodeType == 3 ? textRange(before$1, nodeSize(before$1) - (supportEmptyRange ? 0 : 1))
          : before$1.nodeType == 1 && (before$1.nodeName != "BR" || !before$1.nextSibling) ? before$1 : null;
      if (target) { return flattenV(singleRect(target, 1), false) }
    }
    if (offset < nodeSize(node)) {
      var after$1 = node.childNodes[offset];
      while (after$1.pmViewDesc && after$1.pmViewDesc.ignoreForCoords) { after$1 = after$1.nextSibling; }
      var target$1 = !after$1 ? null : after$1.nodeType == 3 ? textRange(after$1, 0, (supportEmptyRange ? 0 : 1))
          : after$1.nodeType == 1 ? after$1 : null;
      if (target$1) { return flattenV(singleRect(target$1, -1), true) }
    }
    return flattenV(singleRect(node.nodeType == 3 ? textRange(node) : node, -side), side >= 0)
  }
  function flattenV(rect, left) {
    if (rect.width == 0) { return rect }
    var x = left ? rect.left : rect.right;
    return {top: rect.top, bottom: rect.bottom, left: x, right: x}
  }
  function flattenH(rect, top) {
    if (rect.height == 0) { return rect }
    var y = top ? rect.top : rect.bottom;
    return {top: y, bottom: y, left: rect.left, right: rect.right}
  }
  function withFlushedState(view, state, f) {
    var viewState = view.state, active = view.root.activeElement;
    if (viewState != state) { view.updateState(state); }
    if (active != view.dom) { view.focus(); }
    try {
      return f()
    } finally {
      if (viewState != state) { view.updateState(viewState); }
      if (active != view.dom && active) { active.focus(); }
    }
  }
  function endOfTextblockVertical(view, state, dir) {
    var sel = state.selection;
    var $pos = dir == "up" ? sel.$from : sel.$to;
    return withFlushedState(view, state, function () {
      var ref = view.docView.domFromPos($pos.pos, dir == "up" ? -1 : 1);
      var dom = ref.node;
      for (;;) {
        var nearest = view.docView.nearestDesc(dom, true);
        if (!nearest) { break }
        if (nearest.node.isBlock) { dom = nearest.dom; break }
        dom = nearest.dom.parentNode;
      }
      var coords = coordsAtPos(view, $pos.pos, 1);
      for (var child = dom.firstChild; child; child = child.nextSibling) {
        var boxes = (void 0);
        if (child.nodeType == 1) { boxes = child.getClientRects(); }
        else if (child.nodeType == 3) { boxes = textRange(child, 0, child.nodeValue.length).getClientRects(); }
        else { continue }
        for (var i = 0; i < boxes.length; i++) {
          var box = boxes[i];
          if (box.bottom > box.top + 1 &&
              (dir == "up" ? coords.top - box.top > (box.bottom - coords.top) * 2
               : box.bottom - coords.bottom > (coords.bottom - box.top) * 2))
            { return false }
        }
      }
      return true
    })
  }
  var maybeRTL = /[\u0590-\u08ac]/;
  function endOfTextblockHorizontal(view, state, dir) {
    var ref = state.selection;
    var $head = ref.$head;
    if (!$head.parent.isTextblock) { return false }
    var offset = $head.parentOffset, atStart = !offset, atEnd = offset == $head.parent.content.size;
    var sel = view.root.getSelection();
    if (!maybeRTL.test($head.parent.textContent) || !sel.modify)
      { return dir == "left" || dir == "backward" ? atStart : atEnd }
    return withFlushedState(view, state, function () {
      var oldRange = sel.getRangeAt(0), oldNode = sel.focusNode, oldOff = sel.focusOffset;
      var oldBidiLevel = sel.caretBidiLevel;
      sel.modify("move", dir, "character");
      var parentDOM = $head.depth ? view.docView.domAfterPos($head.before()) : view.dom;
      var result = !parentDOM.contains(sel.focusNode.nodeType == 1 ? sel.focusNode : sel.focusNode.parentNode) ||
          (oldNode == sel.focusNode && oldOff == sel.focusOffset);
      sel.removeAllRanges();
      sel.addRange(oldRange);
      if (oldBidiLevel != null) { sel.caretBidiLevel = oldBidiLevel; }
      return result
    })
  }
  var cachedState = null, cachedDir = null, cachedResult = false;
  function endOfTextblock(view, state, dir) {
    if (cachedState == state && cachedDir == dir) { return cachedResult }
    cachedState = state; cachedDir = dir;
    return cachedResult = dir == "up" || dir == "down"
      ? endOfTextblockVertical(view, state, dir)
      : endOfTextblockHorizontal(view, state, dir)
  }
  var NOT_DIRTY = 0, CHILD_DIRTY = 1, CONTENT_DIRTY = 2, NODE_DIRTY = 3;
  var ViewDesc = function ViewDesc(parent, children, dom, contentDOM) {
    this.parent = parent;
    this.children = children;
    this.dom = dom;
    dom.pmViewDesc = this;
    this.contentDOM = contentDOM;
    this.dirty = NOT_DIRTY;
  };
  var prototypeAccessors = { size: { configurable: true },border: { configurable: true },posBefore: { configurable: true },posAtStart: { configurable: true },posAfter: { configurable: true },posAtEnd: { configurable: true },contentLost: { configurable: true },domAtom: { configurable: true },ignoreForCoords: { configurable: true } };
  ViewDesc.prototype.matchesWidget = function matchesWidget () { return false };
  ViewDesc.prototype.matchesMark = function matchesMark () { return false };
  ViewDesc.prototype.matchesNode = function matchesNode () { return false };
  ViewDesc.prototype.matchesHack = function matchesHack (_nodeName) { return false };
  ViewDesc.prototype.parseRule = function parseRule () { return null };
  ViewDesc.prototype.stopEvent = function stopEvent () { return false };
  prototypeAccessors.size.get = function () {
    var size = 0;
    for (var i = 0; i < this.children.length; i++) { size += this.children[i].size; }
    return size
  };
  prototypeAccessors.border.get = function () { return 0 };
  ViewDesc.prototype.destroy = function destroy () {
    this.parent = null;
    if (this.dom.pmViewDesc == this) { this.dom.pmViewDesc = null; }
    for (var i = 0; i < this.children.length; i++)
      { this.children[i].destroy(); }
  };
  ViewDesc.prototype.posBeforeChild = function posBeforeChild (child) {
    for (var i = 0, pos = this.posAtStart; i < this.children.length; i++) {
      var cur = this.children[i];
      if (cur == child) { return pos }
      pos += cur.size;
    }
  };
  prototypeAccessors.posBefore.get = function () {
    return this.parent.posBeforeChild(this)
  };
  prototypeAccessors.posAtStart.get = function () {
    return this.parent ? this.parent.posBeforeChild(this) + this.border : 0
  };
  prototypeAccessors.posAfter.get = function () {
    return this.posBefore + this.size
  };
  prototypeAccessors.posAtEnd.get = function () {
    return this.posAtStart + this.size - 2 * this.border
  };
  ViewDesc.prototype.localPosFromDOM = function localPosFromDOM (dom, offset, bias) {
    if (this.contentDOM && this.contentDOM.contains(dom.nodeType == 1 ? dom : dom.parentNode)) {
      if (bias < 0) {
        var domBefore, desc;
        if (dom == this.contentDOM) {
          domBefore = dom.childNodes[offset - 1];
        } else {
          while (dom.parentNode != this.contentDOM) { dom = dom.parentNode; }
          domBefore = dom.previousSibling;
        }
        while (domBefore && !((desc = domBefore.pmViewDesc) && desc.parent == this)) { domBefore = domBefore.previousSibling; }
        return domBefore ? this.posBeforeChild(desc) + desc.size : this.posAtStart
      } else {
        var domAfter, desc$1;
        if (dom == this.contentDOM) {
          domAfter = dom.childNodes[offset];
        } else {
          while (dom.parentNode != this.contentDOM) { dom = dom.parentNode; }
          domAfter = dom.nextSibling;
        }
        while (domAfter && !((desc$1 = domAfter.pmViewDesc) && desc$1.parent == this)) { domAfter = domAfter.nextSibling; }
        return domAfter ? this.posBeforeChild(desc$1) : this.posAtEnd
      }
    }
    var atEnd;
    if (dom == this.dom && this.contentDOM) {
      atEnd = offset > domIndex(this.contentDOM);
    } else if (this.contentDOM && this.contentDOM != this.dom && this.dom.contains(this.contentDOM)) {
      atEnd = dom.compareDocumentPosition(this.contentDOM) & 2;
    } else if (this.dom.firstChild) {
      if (offset == 0) { for (var search = dom;; search = search.parentNode) {
        if (search == this.dom) { atEnd = false; break }
        if (search.parentNode.firstChild != search) { break }
      } }
      if (atEnd == null && offset == dom.childNodes.length) { for (var search$1 = dom;; search$1 = search$1.parentNode) {
        if (search$1 == this.dom) { atEnd = true; break }
        if (search$1.parentNode.lastChild != search$1) { break }
      } }
    }
    return (atEnd == null ? bias > 0 : atEnd) ? this.posAtEnd : this.posAtStart
  };
  ViewDesc.prototype.nearestDesc = function nearestDesc (dom, onlyNodes) {
    for (var first = true, cur = dom; cur; cur = cur.parentNode) {
      var desc = this.getDesc(cur);
      if (desc && (!onlyNodes || desc.node)) {
        if (first && desc.nodeDOM &&
            !(desc.nodeDOM.nodeType == 1 ? desc.nodeDOM.contains(dom.nodeType == 1 ? dom : dom.parentNode) : desc.nodeDOM == dom))
          { first = false; }
        else
          { return desc }
      }
    }
  };
  ViewDesc.prototype.getDesc = function getDesc (dom) {
    var desc = dom.pmViewDesc;
    for (var cur = desc; cur; cur = cur.parent) { if (cur == this) { return desc } }
  };
  ViewDesc.prototype.posFromDOM = function posFromDOM (dom, offset, bias) {
    for (var scan = dom; scan; scan = scan.parentNode) {
      var desc = this.getDesc(scan);
      if (desc) { return desc.localPosFromDOM(dom, offset, bias) }
    }
    return -1
  };
  ViewDesc.prototype.descAt = function descAt (pos) {
    for (var i = 0, offset = 0; i < this.children.length; i++) {
      var child = this.children[i], end = offset + child.size;
      if (offset == pos && end != offset) {
        while (!child.border && child.children.length) { child = child.children[0]; }
        return child
      }
      if (pos < end) { return child.descAt(pos - offset - child.border) }
      offset = end;
    }
  };
  ViewDesc.prototype.domFromPos = function domFromPos (pos, side) {
    if (!this.contentDOM) { return {node: this.dom, offset: 0} }
    var i = 0, offset = 0;
    for (var curPos = 0; i < this.children.length; i++) {
      var child = this.children[i], end = curPos + child.size;
      if (end > pos || child instanceof TrailingHackViewDesc) { offset = pos - curPos; break }
      curPos = end;
    }
    if (offset) { return this.children[i].domFromPos(offset - this.children[i].border, side) }
    for (var prev = (void 0); i && !(prev = this.children[i - 1]).size && prev instanceof WidgetViewDesc && prev.widget.type.side >= 0; i--) {}
    if (side <= 0) {
      var prev$1, enter = true;
      for (;; i--, enter = false) {
        prev$1 = i ? this.children[i - 1] : null;
        if (!prev$1 || prev$1.dom.parentNode == this.contentDOM) { break }
      }
      if (prev$1 && side && enter && !prev$1.border && !prev$1.domAtom) { return prev$1.domFromPos(prev$1.size, side) }
      return {node: this.contentDOM, offset: prev$1 ? domIndex(prev$1.dom) + 1 : 0}
    } else {
      var next, enter$1 = true;
      for (;; i++, enter$1 = false) {
        next = i < this.children.length ? this.children[i] : null;
        if (!next || next.dom.parentNode == this.contentDOM) { break }
      }
      if (next && enter$1 && !next.border && !next.domAtom) { return next.domFromPos(0, side) }
      return {node: this.contentDOM, offset: next ? domIndex(next.dom) : this.contentDOM.childNodes.length}
    }
  };
  ViewDesc.prototype.parseRange = function parseRange (from, to, base) {
      if ( base === void 0 ) base = 0;
    if (this.children.length == 0)
      { return {node: this.contentDOM, from: from, to: to, fromOffset: 0, toOffset: this.contentDOM.childNodes.length} }
    var fromOffset = -1, toOffset = -1;
    for (var offset = base, i = 0;; i++) {
      var child = this.children[i], end = offset + child.size;
      if (fromOffset == -1 && from <= end) {
        var childBase = offset + child.border;
        if (from >= childBase && to <= end - child.border && child.node &&
            child.contentDOM && this.contentDOM.contains(child.contentDOM))
          { return child.parseRange(from, to, childBase) }
        from = offset;
        for (var j = i; j > 0; j--) {
          var prev = this.children[j - 1];
          if (prev.size && prev.dom.parentNode == this.contentDOM && !prev.emptyChildAt(1)) {
            fromOffset = domIndex(prev.dom) + 1;
            break
          }
          from -= prev.size;
        }
        if (fromOffset == -1) { fromOffset = 0; }
      }
      if (fromOffset > -1 && (end > to || i == this.children.length - 1)) {
        to = end;
        for (var j$1 = i + 1; j$1 < this.children.length; j$1++) {
          var next = this.children[j$1];
          if (next.size && next.dom.parentNode == this.contentDOM && !next.emptyChildAt(-1)) {
            toOffset = domIndex(next.dom);
            break
          }
          to += next.size;
        }
        if (toOffset == -1) { toOffset = this.contentDOM.childNodes.length; }
        break
      }
      offset = end;
    }
    return {node: this.contentDOM, from: from, to: to, fromOffset: fromOffset, toOffset: toOffset}
  };
  ViewDesc.prototype.emptyChildAt = function emptyChildAt (side) {
    if (this.border || !this.contentDOM || !this.children.length) { return false }
    var child = this.children[side < 0 ? 0 : this.children.length - 1];
    return child.size == 0 || child.emptyChildAt(side)
  };
  ViewDesc.prototype.domAfterPos = function domAfterPos (pos) {
    var ref = this.domFromPos(pos, 0);
      var node = ref.node;
      var offset = ref.offset;
    if (node.nodeType != 1 || offset == node.childNodes.length)
      { throw new RangeError("No node after pos " + pos) }
    return node.childNodes[offset]
  };
  ViewDesc.prototype.setSelection = function setSelection (anchor, head, root, force) {
    var from = Math.min(anchor, head), to = Math.max(anchor, head);
    for (var i = 0, offset = 0; i < this.children.length; i++) {
      var child = this.children[i], end = offset + child.size;
      if (from > offset && to < end)
        { return child.setSelection(anchor - offset - child.border, head - offset - child.border, root, force) }
      offset = end;
    }
    var anchorDOM = this.domFromPos(anchor, anchor ? -1 : 1);
    var headDOM = head == anchor ? anchorDOM : this.domFromPos(head, head ? -1 : 1);
    var domSel = root.getSelection();
    var brKludge = false;
    if ((result.gecko || result.safari) && anchor == head) {
      var node = anchorDOM.node;
        var offset$1 = anchorDOM.offset;
      if (node.nodeType == 3) {
        brKludge = offset$1 && node.nodeValue[offset$1 - 1] == "\n";
        if (brKludge && offset$1 == node.nodeValue.length) {
          for (var scan = node, after = (void 0); scan; scan = scan.parentNode) {
            if (after = scan.nextSibling) {
              if (after.nodeName == "BR")
                { anchorDOM = headDOM = {node: after.parentNode, offset: domIndex(after) + 1}; }
              break
            }
            var desc = scan.pmViewDesc;
            if (desc && desc.node && desc.node.isBlock) { break }
          }
        }
      } else {
        var prev = node.childNodes[offset$1 - 1];
        brKludge = prev && (prev.nodeName == "BR" || prev.contentEditable == "false");
      }
    }
    if (result.gecko && domSel.focusNode && domSel.focusNode != headDOM.node && domSel.focusNode.nodeType == 1) {
      var after$1 = domSel.focusNode.childNodes[domSel.focusOffset];
      if (after$1 && after$1.contentEditable == "false") { force = true; }
    }
    if (!(force || brKludge && result.safari) &&
        isEquivalentPosition(anchorDOM.node, anchorDOM.offset, domSel.anchorNode, domSel.anchorOffset) &&
        isEquivalentPosition(headDOM.node, headDOM.offset, domSel.focusNode, domSel.focusOffset))
      { return }
    var domSelExtended = false;
    if ((domSel.extend || anchor == head) && !brKludge) {
      domSel.collapse(anchorDOM.node, anchorDOM.offset);
      try {
        if (anchor != head) { domSel.extend(headDOM.node, headDOM.offset); }
        domSelExtended = true;
      } catch (err) {
        if (!(err instanceof DOMException)) { throw err }
      }
    }
    if (!domSelExtended) {
      if (anchor > head) { var tmp = anchorDOM; anchorDOM = headDOM; headDOM = tmp; }
      var range = document.createRange();
      range.setEnd(headDOM.node, headDOM.offset);
      range.setStart(anchorDOM.node, anchorDOM.offset);
      domSel.removeAllRanges();
      domSel.addRange(range);
    }
  };
  ViewDesc.prototype.ignoreMutation = function ignoreMutation (mutation) {
    return !this.contentDOM && mutation.type != "selection"
  };
  prototypeAccessors.contentLost.get = function () {
    return this.contentDOM && this.contentDOM != this.dom && !this.dom.contains(this.contentDOM)
  };
  ViewDesc.prototype.markDirty = function markDirty (from, to) {
    for (var offset = 0, i = 0; i < this.children.length; i++) {
      var child = this.children[i], end = offset + child.size;
      if (offset == end ? from <= end && to >= offset : from < end && to > offset) {
        var startInside = offset + child.border, endInside = end - child.border;
        if (from >= startInside && to <= endInside) {
          this.dirty = from == offset || to == end ? CONTENT_DIRTY : CHILD_DIRTY;
          if (from == startInside && to == endInside &&
              (child.contentLost || child.dom.parentNode != this.contentDOM)) { child.dirty = NODE_DIRTY; }
          else { child.markDirty(from - startInside, to - startInside); }
          return
        } else {
          child.dirty = child.dom == child.contentDOM && child.dom.parentNode == this.contentDOM && !child.children.length
            ? CONTENT_DIRTY : NODE_DIRTY;
        }
      }
      offset = end;
    }
    this.dirty = CONTENT_DIRTY;
  };
  ViewDesc.prototype.markParentsDirty = function markParentsDirty () {
    var level = 1;
    for (var node = this.parent; node; node = node.parent, level++) {
      var dirty = level == 1 ? CONTENT_DIRTY : CHILD_DIRTY;
      if (node.dirty < dirty) { node.dirty = dirty; }
    }
  };
  prototypeAccessors.domAtom.get = function () { return false };
  prototypeAccessors.ignoreForCoords.get = function () { return false };
  Object.defineProperties( ViewDesc.prototype, prototypeAccessors );
  var nothing = [];
  var WidgetViewDesc = (function (ViewDesc) {
    function WidgetViewDesc(parent, widget, view, pos) {
      var self, dom = widget.type.toDOM;
      if (typeof dom == "function") { dom = dom(view, function () {
        if (!self) { return pos }
        if (self.parent) { return self.parent.posBeforeChild(self) }
      }); }
      if (!widget.type.spec.raw) {
        if (dom.nodeType != 1) {
          var wrap = document.createElement("span");
          wrap.appendChild(dom);
          dom = wrap;
        }
        dom.contentEditable = false;
        dom.classList.add("ProseMirror-widget");
      }
      ViewDesc.call(this, parent, nothing, dom, null);
      this.widget = widget;
      self = this;
    }
    if ( ViewDesc ) WidgetViewDesc.__proto__ = ViewDesc;
    WidgetViewDesc.prototype = Object.create( ViewDesc && ViewDesc.prototype );
    WidgetViewDesc.prototype.constructor = WidgetViewDesc;
    var prototypeAccessors$1 = { domAtom: { configurable: true } };
    WidgetViewDesc.prototype.matchesWidget = function matchesWidget (widget) {
      return this.dirty == NOT_DIRTY && widget.type.eq(this.widget.type)
    };
    WidgetViewDesc.prototype.parseRule = function parseRule () { return {ignore: true} };
    WidgetViewDesc.prototype.stopEvent = function stopEvent (event) {
      var stop = this.widget.spec.stopEvent;
      return stop ? stop(event) : false
    };
    WidgetViewDesc.prototype.ignoreMutation = function ignoreMutation (mutation) {
      return mutation.type != "selection" || this.widget.spec.ignoreSelection
    };
    WidgetViewDesc.prototype.destroy = function destroy () {
      this.widget.type.destroy(this.dom);
      ViewDesc.prototype.destroy.call(this);
    };
    prototypeAccessors$1.domAtom.get = function () { return true };
    Object.defineProperties( WidgetViewDesc.prototype, prototypeAccessors$1 );
    return WidgetViewDesc;
  }(ViewDesc));
  var CompositionViewDesc = (function (ViewDesc) {
    function CompositionViewDesc(parent, dom, textDOM, text) {
      ViewDesc.call(this, parent, nothing, dom, null);
      this.textDOM = textDOM;
      this.text = text;
    }
    if ( ViewDesc ) CompositionViewDesc.__proto__ = ViewDesc;
    CompositionViewDesc.prototype = Object.create( ViewDesc && ViewDesc.prototype );
    CompositionViewDesc.prototype.constructor = CompositionViewDesc;
    var prototypeAccessors$2 = { size: { configurable: true } };
    prototypeAccessors$2.size.get = function () { return this.text.length };
    CompositionViewDesc.prototype.localPosFromDOM = function localPosFromDOM (dom, offset) {
      if (dom != this.textDOM) { return this.posAtStart + (offset ? this.size : 0) }
      return this.posAtStart + offset
    };
    CompositionViewDesc.prototype.domFromPos = function domFromPos (pos) {
      return {node: this.textDOM, offset: pos}
    };
    CompositionViewDesc.prototype.ignoreMutation = function ignoreMutation (mut) {
      return mut.type === 'characterData' && mut.target.nodeValue == mut.oldValue
     };
    Object.defineProperties( CompositionViewDesc.prototype, prototypeAccessors$2 );
    return CompositionViewDesc;
  }(ViewDesc));
  var MarkViewDesc = (function (ViewDesc) {
    function MarkViewDesc(parent, mark, dom, contentDOM) {
      ViewDesc.call(this, parent, [], dom, contentDOM);
      this.mark = mark;
    }
    if ( ViewDesc ) MarkViewDesc.__proto__ = ViewDesc;
    MarkViewDesc.prototype = Object.create( ViewDesc && ViewDesc.prototype );
    MarkViewDesc.prototype.constructor = MarkViewDesc;
    MarkViewDesc.create = function create (parent, mark, inline, view) {
      var custom = view.nodeViews[mark.type.name];
      var spec = custom && custom(mark, view, inline);
      if (!spec || !spec.dom)
        { spec = DOMSerializer.renderSpec(document, mark.type.spec.toDOM(mark, inline)); }
      return new MarkViewDesc(parent, mark, spec.dom, spec.contentDOM || spec.dom)
    };
    MarkViewDesc.prototype.parseRule = function parseRule () {
      if ((this.dirty & NODE_DIRTY) || this.mark.type.spec.reparseInView) { return null }
      return {mark: this.mark.type.name, attrs: this.mark.attrs, contentElement: this.contentDOM}
    };
    MarkViewDesc.prototype.matchesMark = function matchesMark (mark) { return this.dirty != NODE_DIRTY && this.mark.eq(mark) };
    MarkViewDesc.prototype.markDirty = function markDirty (from, to) {
      ViewDesc.prototype.markDirty.call(this, from, to);
      if (this.dirty != NOT_DIRTY) {
        var parent = this.parent;
        while (!parent.node) { parent = parent.parent; }
        if (parent.dirty < this.dirty) { parent.dirty = this.dirty; }
        this.dirty = NOT_DIRTY;
      }
    };
    MarkViewDesc.prototype.slice = function slice (from, to, view) {
      var copy = MarkViewDesc.create(this.parent, this.mark, true, view);
      var nodes = this.children, size = this.size;
      if (to < size) { nodes = replaceNodes(nodes, to, size, view); }
      if (from > 0) { nodes = replaceNodes(nodes, 0, from, view); }
      for (var i = 0; i < nodes.length; i++) { nodes[i].parent = copy; }
      copy.children = nodes;
      return copy
    };
    return MarkViewDesc;
  }(ViewDesc));
  var NodeViewDesc = (function (ViewDesc) {
    function NodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, view, pos) {
      ViewDesc.call(this, parent, node.isLeaf ? nothing : [], dom, contentDOM);
      this.nodeDOM = nodeDOM;
      this.node = node;
      this.outerDeco = outerDeco;
      this.innerDeco = innerDeco;
      if (contentDOM) { this.updateChildren(view, pos); }
    }
    if ( ViewDesc ) NodeViewDesc.__proto__ = ViewDesc;
    NodeViewDesc.prototype = Object.create( ViewDesc && ViewDesc.prototype );
    NodeViewDesc.prototype.constructor = NodeViewDesc;
    var prototypeAccessors$3 = { size: { configurable: true },border: { configurable: true },domAtom: { configurable: true } };
    NodeViewDesc.create = function create (parent, node, outerDeco, innerDeco, view, pos) {
      var assign;
      var custom = view.nodeViews[node.type.name], descObj;
      var spec = custom && custom(node, view, function () {
        if (!descObj) { return pos }
        if (descObj.parent) { return descObj.parent.posBeforeChild(descObj) }
      }, outerDeco, innerDeco);
      var dom = spec && spec.dom, contentDOM = spec && spec.contentDOM;
      if (node.isText) {
        if (!dom) { dom = document.createTextNode(node.text); }
        else if (dom.nodeType != 3) { throw new RangeError("Text must be rendered as a DOM text node") }
      } else if (!dom) {
  ((assign = DOMSerializer.renderSpec(document, node.type.spec.toDOM(node)), dom = assign.dom, contentDOM = assign.contentDOM));
      }
      if (!contentDOM && !node.isText && dom.nodeName != "BR") {
        if (!dom.hasAttribute("contenteditable")) { dom.contentEditable = false; }
        if (node.type.spec.draggable) { dom.draggable = true; }
      }
      var nodeDOM = dom;
      dom = applyOuterDeco(dom, outerDeco, node);
      if (spec)
        { return descObj = new CustomNodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM,
                                                spec, view, pos + 1) }
      else if (node.isText)
        { return new TextViewDesc(parent, node, outerDeco, innerDeco, dom, nodeDOM, view) }
      else
        { return new NodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, view, pos + 1) }
    };
    NodeViewDesc.prototype.parseRule = function parseRule () {
      var this$1$1 = this;
      if (this.node.type.spec.reparseInView) { return null }
      var rule = {node: this.node.type.name, attrs: this.node.attrs};
      if (this.node.type.whitespace == "pre") { rule.preserveWhitespace = "full"; }
      if (this.contentDOM && !this.contentLost) { rule.contentElement = this.contentDOM; }
      else { rule.getContent = function () { return this$1$1.contentDOM ? Fragment.empty : this$1$1.node.content; }; }
      return rule
    };
    NodeViewDesc.prototype.matchesNode = function matchesNode (node, outerDeco, innerDeco) {
      return this.dirty == NOT_DIRTY && node.eq(this.node) &&
        sameOuterDeco(outerDeco, this.outerDeco) && innerDeco.eq(this.innerDeco)
    };
    prototypeAccessors$3.size.get = function () { return this.node.nodeSize };
    prototypeAccessors$3.border.get = function () { return this.node.isLeaf ? 0 : 1 };
    NodeViewDesc.prototype.updateChildren = function updateChildren (view, pos) {
      var this$1$1 = this;
      var inline = this.node.inlineContent, off = pos;
      var composition = view.composing && this.localCompositionInfo(view, pos);
      var localComposition = composition && composition.pos > -1 ? composition : null;
      var compositionInChild = composition && composition.pos < 0;
      var updater = new ViewTreeUpdater(this, localComposition && localComposition.node);
      iterDeco(this.node, this.innerDeco, function (widget, i, insideNode) {
        if (widget.spec.marks)
          { updater.syncToMarks(widget.spec.marks, inline, view); }
        else if (widget.type.side >= 0 && !insideNode)
          { updater.syncToMarks(i == this$1$1.node.childCount ? Mark$1.none : this$1$1.node.child(i).marks, inline, view); }
        updater.placeWidget(widget, view, off);
      }, function (child, outerDeco, innerDeco, i) {
        updater.syncToMarks(child.marks, inline, view);
        var compIndex;
        if (updater.findNodeMatch(child, outerDeco, innerDeco, i)) ; else if (compositionInChild && view.state.selection.from > off &&
                   view.state.selection.to < off + child.nodeSize &&
                   (compIndex = updater.findIndexWithChild(composition.node)) > -1 &&
                   updater.updateNodeAt(child, outerDeco, innerDeco, compIndex, view)) ; else if (updater.updateNextNode(child, outerDeco, innerDeco, view, i)) ; else {
          updater.addNode(child, outerDeco, innerDeco, view, off);
        }
        off += child.nodeSize;
      });
      updater.syncToMarks(nothing, inline, view);
      if (this.node.isTextblock) { updater.addTextblockHacks(); }
      updater.destroyRest();
      if (updater.changed || this.dirty == CONTENT_DIRTY) {
        if (localComposition) { this.protectLocalComposition(view, localComposition); }
        renderDescs(this.contentDOM, this.children, view);
        if (result.ios) { iosHacks(this.dom); }
      }
    };
    NodeViewDesc.prototype.localCompositionInfo = function localCompositionInfo (view, pos) {
      var ref = view.state.selection;
      var from = ref.from;
      var to = ref.to;
      if (!(view.state.selection instanceof TextSelection) || from < pos || to > pos + this.node.content.size) { return }
      var sel = view.root.getSelection();
      var textNode = nearbyTextNode(sel.focusNode, sel.focusOffset);
      if (!textNode || !this.dom.contains(textNode.parentNode)) { return }
      if (this.node.inlineContent) {
        var text = textNode.nodeValue;
        var textPos = findTextInFragment(this.node.content, text, from - pos, to - pos);
        return textPos < 0 ? null : {node: textNode, pos: textPos, text: text}
      } else {
        return {node: textNode, pos: -1}
      }
    };
    NodeViewDesc.prototype.protectLocalComposition = function protectLocalComposition (view, ref) {
      var node = ref.node;
      var pos = ref.pos;
      var text = ref.text;
      if (this.getDesc(node)) { return }
      var topNode = node;
      for (;; topNode = topNode.parentNode) {
        if (topNode.parentNode == this.contentDOM) { break }
        while (topNode.previousSibling) { topNode.parentNode.removeChild(topNode.previousSibling); }
        while (topNode.nextSibling) { topNode.parentNode.removeChild(topNode.nextSibling); }
        if (topNode.pmViewDesc) { topNode.pmViewDesc = null; }
      }
      var desc = new CompositionViewDesc(this, topNode, node, text);
      view.compositionNodes.push(desc);
      this.children = replaceNodes(this.children, pos, pos + text.length, view, desc);
    };
    NodeViewDesc.prototype.update = function update (node, outerDeco, innerDeco, view) {
      if (this.dirty == NODE_DIRTY ||
          !node.sameMarkup(this.node)) { return false }
      this.updateInner(node, outerDeco, innerDeco, view);
      return true
    };
    NodeViewDesc.prototype.updateInner = function updateInner (node, outerDeco, innerDeco, view) {
      this.updateOuterDeco(outerDeco);
      this.node = node;
      this.innerDeco = innerDeco;
      if (this.contentDOM) { this.updateChildren(view, this.posAtStart); }
      this.dirty = NOT_DIRTY;
    };
    NodeViewDesc.prototype.updateOuterDeco = function updateOuterDeco (outerDeco) {
      if (sameOuterDeco(outerDeco, this.outerDeco)) { return }
      var needsWrap = this.nodeDOM.nodeType != 1;
      var oldDOM = this.dom;
      this.dom = patchOuterDeco(this.dom, this.nodeDOM,
                                computeOuterDeco(this.outerDeco, this.node, needsWrap),
                                computeOuterDeco(outerDeco, this.node, needsWrap));
      if (this.dom != oldDOM) {
        oldDOM.pmViewDesc = null;
        this.dom.pmViewDesc = this;
      }
      this.outerDeco = outerDeco;
    };
    NodeViewDesc.prototype.selectNode = function selectNode () {
      this.nodeDOM.classList.add("ProseMirror-selectednode");
      if (this.contentDOM || !this.node.type.spec.draggable) { this.dom.draggable = true; }
    };
    NodeViewDesc.prototype.deselectNode = function deselectNode () {
      this.nodeDOM.classList.remove("ProseMirror-selectednode");
      if (this.contentDOM || !this.node.type.spec.draggable) { this.dom.removeAttribute("draggable"); }
    };
    prototypeAccessors$3.domAtom.get = function () { return this.node.isAtom };
    Object.defineProperties( NodeViewDesc.prototype, prototypeAccessors$3 );
    return NodeViewDesc;
  }(ViewDesc));
  function docViewDesc(doc, outerDeco, innerDeco, dom, view) {
    applyOuterDeco(dom, outerDeco, doc);
    return new NodeViewDesc(null, doc, outerDeco, innerDeco, dom, dom, dom, view, 0)
  }
  var TextViewDesc = (function (NodeViewDesc) {
    function TextViewDesc(parent, node, outerDeco, innerDeco, dom, nodeDOM, view) {
      NodeViewDesc.call(this, parent, node, outerDeco, innerDeco, dom, null, nodeDOM, view);
    }
    if ( NodeViewDesc ) TextViewDesc.__proto__ = NodeViewDesc;
    TextViewDesc.prototype = Object.create( NodeViewDesc && NodeViewDesc.prototype );
    TextViewDesc.prototype.constructor = TextViewDesc;
    var prototypeAccessors$4 = { domAtom: { configurable: true } };
    TextViewDesc.prototype.parseRule = function parseRule () {
      var skip = this.nodeDOM.parentNode;
      while (skip && skip != this.dom && !skip.pmIsDeco) { skip = skip.parentNode; }
      return {skip: skip || true}
    };
    TextViewDesc.prototype.update = function update (node, outerDeco, _, view) {
      if (this.dirty == NODE_DIRTY || (this.dirty != NOT_DIRTY && !this.inParent()) ||
          !node.sameMarkup(this.node)) { return false }
      this.updateOuterDeco(outerDeco);
      if ((this.dirty != NOT_DIRTY || node.text != this.node.text) && node.text != this.nodeDOM.nodeValue) {
        this.nodeDOM.nodeValue = node.text;
        if (view.trackWrites == this.nodeDOM) { view.trackWrites = null; }
      }
      this.node = node;
      this.dirty = NOT_DIRTY;
      return true
    };
    TextViewDesc.prototype.inParent = function inParent () {
      var parentDOM = this.parent.contentDOM;
      for (var n = this.nodeDOM; n; n = n.parentNode) { if (n == parentDOM) { return true } }
      return false
    };
    TextViewDesc.prototype.domFromPos = function domFromPos (pos) {
      return {node: this.nodeDOM, offset: pos}
    };
    TextViewDesc.prototype.localPosFromDOM = function localPosFromDOM (dom, offset, bias) {
      if (dom == this.nodeDOM) { return this.posAtStart + Math.min(offset, this.node.text.length) }
      return NodeViewDesc.prototype.localPosFromDOM.call(this, dom, offset, bias)
    };
    TextViewDesc.prototype.ignoreMutation = function ignoreMutation (mutation) {
      return mutation.type != "characterData" && mutation.type != "selection"
    };
    TextViewDesc.prototype.slice = function slice (from, to, view) {
      var node = this.node.cut(from, to), dom = document.createTextNode(node.text);
      return new TextViewDesc(this.parent, node, this.outerDeco, this.innerDeco, dom, dom, view)
    };
    TextViewDesc.prototype.markDirty = function markDirty (from, to) {
      NodeViewDesc.prototype.markDirty.call(this, from, to);
      if (this.dom != this.nodeDOM && (from == 0 || to == this.nodeDOM.nodeValue.length))
        { this.dirty = NODE_DIRTY; }
    };
    prototypeAccessors$4.domAtom.get = function () { return false };
    Object.defineProperties( TextViewDesc.prototype, prototypeAccessors$4 );
    return TextViewDesc;
  }(NodeViewDesc));
  var TrailingHackViewDesc = (function (ViewDesc) {
    function TrailingHackViewDesc () {
      ViewDesc.apply(this, arguments);
    }
    if ( ViewDesc ) TrailingHackViewDesc.__proto__ = ViewDesc;
    TrailingHackViewDesc.prototype = Object.create( ViewDesc && ViewDesc.prototype );
    TrailingHackViewDesc.prototype.constructor = TrailingHackViewDesc;
    var prototypeAccessors$5 = { domAtom: { configurable: true },ignoreForCoords: { configurable: true } };
    TrailingHackViewDesc.prototype.parseRule = function parseRule () { return {ignore: true} };
    TrailingHackViewDesc.prototype.matchesHack = function matchesHack (nodeName) { return this.dirty == NOT_DIRTY && this.dom.nodeName == nodeName };
    prototypeAccessors$5.domAtom.get = function () { return true };
    prototypeAccessors$5.ignoreForCoords.get = function () { return this.dom.nodeName == "IMG" };
    Object.defineProperties( TrailingHackViewDesc.prototype, prototypeAccessors$5 );
    return TrailingHackViewDesc;
  }(ViewDesc));
  var CustomNodeViewDesc = (function (NodeViewDesc) {
    function CustomNodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, spec, view, pos) {
      NodeViewDesc.call(this, parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, view, pos);
      this.spec = spec;
    }
    if ( NodeViewDesc ) CustomNodeViewDesc.__proto__ = NodeViewDesc;
    CustomNodeViewDesc.prototype = Object.create( NodeViewDesc && NodeViewDesc.prototype );
    CustomNodeViewDesc.prototype.constructor = CustomNodeViewDesc;
    CustomNodeViewDesc.prototype.update = function update (node, outerDeco, innerDeco, view) {
      if (this.dirty == NODE_DIRTY) { return false }
      if (this.spec.update) {
        var result = this.spec.update(node, outerDeco, innerDeco);
        if (result) { this.updateInner(node, outerDeco, innerDeco, view); }
        return result
      } else if (!this.contentDOM && !node.isLeaf) {
        return false
      } else {
        return NodeViewDesc.prototype.update.call(this, node, outerDeco, innerDeco, view)
      }
    };
    CustomNodeViewDesc.prototype.selectNode = function selectNode () {
      this.spec.selectNode ? this.spec.selectNode() : NodeViewDesc.prototype.selectNode.call(this);
    };
    CustomNodeViewDesc.prototype.deselectNode = function deselectNode () {
      this.spec.deselectNode ? this.spec.deselectNode() : NodeViewDesc.prototype.deselectNode.call(this);
    };
    CustomNodeViewDesc.prototype.setSelection = function setSelection (anchor, head, root, force) {
      this.spec.setSelection ? this.spec.setSelection(anchor, head, root)
        : NodeViewDesc.prototype.setSelection.call(this, anchor, head, root, force);
    };
    CustomNodeViewDesc.prototype.destroy = function destroy () {
      if (this.spec.destroy) { this.spec.destroy(); }
      NodeViewDesc.prototype.destroy.call(this);
    };
    CustomNodeViewDesc.prototype.stopEvent = function stopEvent (event) {
      return this.spec.stopEvent ? this.spec.stopEvent(event) : false
    };
    CustomNodeViewDesc.prototype.ignoreMutation = function ignoreMutation (mutation) {
      return this.spec.ignoreMutation ? this.spec.ignoreMutation(mutation) : NodeViewDesc.prototype.ignoreMutation.call(this, mutation)
    };
    return CustomNodeViewDesc;
  }(NodeViewDesc));
  function renderDescs(parentDOM, descs, view) {
    var dom = parentDOM.firstChild, written = false;
    for (var i = 0; i < descs.length; i++) {
      var desc = descs[i], childDOM = desc.dom;
      if (childDOM.parentNode == parentDOM) {
        while (childDOM != dom) { dom = rm(dom); written = true; }
        dom = dom.nextSibling;
      } else {
        written = true;
        parentDOM.insertBefore(childDOM, dom);
      }
      if (desc instanceof MarkViewDesc) {
        var pos = dom ? dom.previousSibling : parentDOM.lastChild;
        renderDescs(desc.contentDOM, desc.children, view);
        dom = pos ? pos.nextSibling : parentDOM.firstChild;
      }
    }
    while (dom) { dom = rm(dom); written = true; }
    if (written && view.trackWrites == parentDOM) { view.trackWrites = null; }
  }
  function OuterDecoLevel(nodeName) {
    if (nodeName) { this.nodeName = nodeName; }
  }
  OuterDecoLevel.prototype = Object.create(null);
  var noDeco = [new OuterDecoLevel];
  function computeOuterDeco(outerDeco, node, needsWrap) {
    if (outerDeco.length == 0) { return noDeco }
    var top = needsWrap ? noDeco[0] : new OuterDecoLevel, result = [top];
    for (var i = 0; i < outerDeco.length; i++) {
      var attrs = outerDeco[i].type.attrs;
      if (!attrs) { continue }
      if (attrs.nodeName)
        { result.push(top = new OuterDecoLevel(attrs.nodeName)); }
      for (var name in attrs) {
        var val = attrs[name];
        if (val == null) { continue }
        if (needsWrap && result.length == 1)
          { result.push(top = new OuterDecoLevel(node.isInline ? "span" : "div")); }
        if (name == "class") { top.class = (top.class ? top.class + " " : "") + val; }
        else if (name == "style") { top.style = (top.style ? top.style + ";" : "") + val; }
        else if (name != "nodeName") { top[name] = val; }
      }
    }
    return result
  }
  function patchOuterDeco(outerDOM, nodeDOM, prevComputed, curComputed) {
    if (prevComputed == noDeco && curComputed == noDeco) { return nodeDOM }
    var curDOM = nodeDOM;
    for (var i = 0; i < curComputed.length; i++) {
      var deco = curComputed[i], prev = prevComputed[i];
      if (i) {
        var parent = (void 0);
        if (prev && prev.nodeName == deco.nodeName && curDOM != outerDOM &&
            (parent = curDOM.parentNode) && parent.tagName.toLowerCase() == deco.nodeName) {
          curDOM = parent;
        } else {
          parent = document.createElement(deco.nodeName);
          parent.pmIsDeco = true;
          parent.appendChild(curDOM);
          prev = noDeco[0];
          curDOM = parent;
        }
      }
      patchAttributes(curDOM, prev || noDeco[0], deco);
    }
    return curDOM
  }
  function patchAttributes(dom, prev, cur) {
    for (var name in prev)
      { if (name != "class" && name != "style" && name != "nodeName" && !(name in cur))
        { dom.removeAttribute(name); } }
    for (var name$1 in cur)
      { if (name$1 != "class" && name$1 != "style" && name$1 != "nodeName" && cur[name$1] != prev[name$1])
        { dom.setAttribute(name$1, cur[name$1]); } }
    if (prev.class != cur.class) {
      var prevList = prev.class ? prev.class.split(" ").filter(Boolean) : nothing;
      var curList = cur.class ? cur.class.split(" ").filter(Boolean) : nothing;
      for (var i = 0; i < prevList.length; i++) { if (curList.indexOf(prevList[i]) == -1)
        { dom.classList.remove(prevList[i]); } }
      for (var i$1 = 0; i$1 < curList.length; i$1++) { if (prevList.indexOf(curList[i$1]) == -1)
        { dom.classList.add(curList[i$1]); } }
      if (dom.classList.length == 0)
        { dom.removeAttribute("class"); }
    }
    if (prev.style != cur.style) {
      if (prev.style) {
        var prop = /\s*([\w\-\xa1-\uffff]+)\s*:(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\(.*?\)|[^;])*/g, m;
        while (m = prop.exec(prev.style))
          { dom.style.removeProperty(m[1]); }
      }
      if (cur.style)
        { dom.style.cssText += cur.style; }
    }
  }
  function applyOuterDeco(dom, deco, node) {
    return patchOuterDeco(dom, dom, noDeco, computeOuterDeco(deco, node, dom.nodeType != 1))
  }
  function sameOuterDeco(a, b) {
    if (a.length != b.length) { return false }
    for (var i = 0; i < a.length; i++) { if (!a[i].type.eq(b[i].type)) { return false } }
    return true
  }
  function rm(dom) {
    var next = dom.nextSibling;
    dom.parentNode.removeChild(dom);
    return next
  }
  var ViewTreeUpdater = function ViewTreeUpdater(top, lockedNode) {
    this.top = top;
    this.lock = lockedNode;
    this.index = 0;
    this.stack = [];
    this.changed = false;
    this.preMatch = preMatch(top.node.content, top);
  };
  ViewTreeUpdater.prototype.destroyBetween = function destroyBetween (start, end) {
    if (start == end) { return }
    for (var i = start; i < end; i++) { this.top.children[i].destroy(); }
    this.top.children.splice(start, end - start);
    this.changed = true;
  };
  ViewTreeUpdater.prototype.destroyRest = function destroyRest () {
    this.destroyBetween(this.index, this.top.children.length);
  };
  ViewTreeUpdater.prototype.syncToMarks = function syncToMarks (marks, inline, view) {
    var keep = 0, depth = this.stack.length >> 1;
    var maxKeep = Math.min(depth, marks.length);
    while (keep < maxKeep &&
           (keep == depth - 1 ? this.top : this.stack[(keep + 1) << 1]).matchesMark(marks[keep]) && marks[keep].type.spec.spanning !== false)
      { keep++; }
    while (keep < depth) {
      this.destroyRest();
      this.top.dirty = NOT_DIRTY;
      this.index = this.stack.pop();
      this.top = this.stack.pop();
      depth--;
    }
    while (depth < marks.length) {
      this.stack.push(this.top, this.index + 1);
      var found = -1;
      for (var i = this.index; i < Math.min(this.index + 3, this.top.children.length); i++) {
        if (this.top.children[i].matchesMark(marks[depth])) { found = i; break }
      }
      if (found > -1) {
        if (found > this.index) {
          this.changed = true;
          this.destroyBetween(this.index, found);
        }
        this.top = this.top.children[this.index];
      } else {
        var markDesc = MarkViewDesc.create(this.top, marks[depth], inline, view);
        this.top.children.splice(this.index, 0, markDesc);
        this.top = markDesc;
        this.changed = true;
      }
      this.index = 0;
      depth++;
    }
  };
  ViewTreeUpdater.prototype.findNodeMatch = function findNodeMatch (node, outerDeco, innerDeco, index) {
    var found = -1, targetDesc;
    if (index >= this.preMatch.index &&
        (targetDesc = this.preMatch.matches[index - this.preMatch.index]).parent == this.top &&
        targetDesc.matchesNode(node, outerDeco, innerDeco)) {
      found = this.top.children.indexOf(targetDesc, this.index);
    } else {
      for (var i = this.index, e = Math.min(this.top.children.length, i + 5); i < e; i++) {
        var child = this.top.children[i];
        if (child.matchesNode(node, outerDeco, innerDeco) && !this.preMatch.matched.has(child)) {
          found = i;
          break
        }
      }
    }
    if (found < 0) { return false }
    this.destroyBetween(this.index, found);
    this.index++;
    return true
  };
  ViewTreeUpdater.prototype.updateNodeAt = function updateNodeAt (node, outerDeco, innerDeco, index, view) {
    var child = this.top.children[index];
    if (!child.update(node, outerDeco, innerDeco, view)) { return false }
    this.destroyBetween(this.index, index);
    this.index = index + 1;
    return true
  };
  ViewTreeUpdater.prototype.findIndexWithChild = function findIndexWithChild (domNode) {
    for (;;) {
      var parent = domNode.parentNode;
      if (!parent) { return -1 }
      if (parent == this.top.contentDOM) {
        var desc = domNode.pmViewDesc;
        if (desc) { for (var i = this.index; i < this.top.children.length; i++) {
          if (this.top.children[i] == desc) { return i }
        } }
        return -1
      }
      domNode = parent;
    }
  };
  ViewTreeUpdater.prototype.updateNextNode = function updateNextNode (node, outerDeco, innerDeco, view, index) {
    for (var i = this.index; i < this.top.children.length; i++) {
      var next = this.top.children[i];
      if (next instanceof NodeViewDesc) {
        var preMatch = this.preMatch.matched.get(next);
        if (preMatch != null && preMatch != index) { return false }
        var nextDOM = next.dom;
        var locked = this.lock && (nextDOM == this.lock || nextDOM.nodeType == 1 && nextDOM.contains(this.lock.parentNode)) &&
            !(node.isText && next.node && next.node.isText && next.nodeDOM.nodeValue == node.text &&
              next.dirty != NODE_DIRTY && sameOuterDeco(outerDeco, next.outerDeco));
        if (!locked && next.update(node, outerDeco, innerDeco, view)) {
          this.destroyBetween(this.index, i);
          if (next.dom != nextDOM) { this.changed = true; }
          this.index++;
          return true
        }
        break
      }
    }
    return false
  };
  ViewTreeUpdater.prototype.addNode = function addNode (node, outerDeco, innerDeco, view, pos) {
    this.top.children.splice(this.index++, 0, NodeViewDesc.create(this.top, node, outerDeco, innerDeco, view, pos));
    this.changed = true;
  };
  ViewTreeUpdater.prototype.placeWidget = function placeWidget (widget, view, pos) {
    var next = this.index < this.top.children.length ? this.top.children[this.index] : null;
    if (next && next.matchesWidget(widget) && (widget == next.widget || !next.widget.type.toDOM.parentNode)) {
      this.index++;
    } else {
      var desc = new WidgetViewDesc(this.top, widget, view, pos);
      this.top.children.splice(this.index++, 0, desc);
      this.changed = true;
    }
  };
  ViewTreeUpdater.prototype.addTextblockHacks = function addTextblockHacks () {
    var lastChild = this.top.children[this.index - 1];
    while (lastChild instanceof MarkViewDesc) { lastChild = lastChild.children[lastChild.children.length - 1]; }
    if (!lastChild ||
        !(lastChild instanceof TextViewDesc) ||
        /\n$/.test(lastChild.node.text)) {
      if ((result.safari || result.chrome) && lastChild && lastChild.dom.contentEditable == "false")
        { this.addHackNode("IMG"); }
      this.addHackNode("BR");
    }
  };
  ViewTreeUpdater.prototype.addHackNode = function addHackNode (nodeName) {
    if (this.index < this.top.children.length && this.top.children[this.index].matchesHack(nodeName)) {
      this.index++;
    } else {
      var dom = document.createElement(nodeName);
      if (nodeName == "IMG") {
        dom.className = "ProseMirror-separator";
        dom.alt = "";
      }
      if (nodeName == "BR") { dom.className = "ProseMirror-trailingBreak"; }
      this.top.children.splice(this.index++, 0, new TrailingHackViewDesc(this.top, nothing, dom, null));
      this.changed = true;
    }
  };
  function preMatch(frag, parentDesc) {
    var curDesc = parentDesc, descI = curDesc.children.length;
    var fI = frag.childCount, matched = new Map, matches = [];
    outer: while (fI > 0) {
      var desc = (void 0);
      for (;;) {
        if (descI) {
          var next = curDesc.children[descI - 1];
          if (next instanceof MarkViewDesc) {
            curDesc = next;
            descI = next.children.length;
          } else {
            desc = next;
            descI--;
            break
          }
        } else if (curDesc == parentDesc) {
          break outer
        } else {
          descI = curDesc.parent.children.indexOf(curDesc);
          curDesc = curDesc.parent;
        }
      }
      var node = desc.node;
      if (!node) { continue }
      if (node != frag.child(fI - 1)) { break }
      --fI;
      matched.set(desc, fI);
      matches.push(desc);
    }
    return {index: fI, matched: matched, matches: matches.reverse()}
  }
  function compareSide(a, b) { return a.type.side - b.type.side }
  function iterDeco(parent, deco, onWidget, onNode) {
    var locals = deco.locals(parent), offset = 0;
    if (locals.length == 0) {
      for (var i = 0; i < parent.childCount; i++) {
        var child = parent.child(i);
        onNode(child, locals, deco.forChild(offset, child), i);
        offset += child.nodeSize;
      }
      return
    }
    var decoIndex = 0, active = [], restNode = null;
    for (var parentIndex = 0;;) {
      if (decoIndex < locals.length && locals[decoIndex].to == offset) {
        var widget = locals[decoIndex++], widgets = (void 0);
        while (decoIndex < locals.length && locals[decoIndex].to == offset)
          { (widgets || (widgets = [widget])).push(locals[decoIndex++]); }
        if (widgets) {
          widgets.sort(compareSide);
          for (var i$1 = 0; i$1 < widgets.length; i$1++) { onWidget(widgets[i$1], parentIndex, !!restNode); }
        } else {
          onWidget(widget, parentIndex, !!restNode);
        }
      }
      var child$1 = (void 0), index = (void 0);
      if (restNode) {
        index = -1;
        child$1 = restNode;
        restNode = null;
      } else if (parentIndex < parent.childCount) {
        index = parentIndex;
        child$1 = parent.child(parentIndex++);
      } else {
        break
      }
      for (var i$2 = 0; i$2 < active.length; i$2++) { if (active[i$2].to <= offset) { active.splice(i$2--, 1); } }
      while (decoIndex < locals.length && locals[decoIndex].from <= offset && locals[decoIndex].to > offset)
        { active.push(locals[decoIndex++]); }
      var end = offset + child$1.nodeSize;
      if (child$1.isText) {
        var cutAt = end;
        if (decoIndex < locals.length && locals[decoIndex].from < cutAt) { cutAt = locals[decoIndex].from; }
        for (var i$3 = 0; i$3 < active.length; i$3++) { if (active[i$3].to < cutAt) { cutAt = active[i$3].to; } }
        if (cutAt < end) {
          restNode = child$1.cut(cutAt - offset);
          child$1 = child$1.cut(0, cutAt - offset);
          end = cutAt;
          index = -1;
        }
      }
      var outerDeco = !active.length ? nothing
          : child$1.isInline && !child$1.isLeaf ? active.filter(function (d) { return !d.inline; })
          : active.slice();
      onNode(child$1, outerDeco, deco.forChild(offset, child$1), index);
      offset = end;
    }
  }
  function iosHacks(dom) {
    if (dom.nodeName == "UL" || dom.nodeName == "OL") {
      var oldCSS = dom.style.cssText;
      dom.style.cssText = oldCSS + "; list-style: square !important";
      window.getComputedStyle(dom).listStyle;
      dom.style.cssText = oldCSS;
    }
  }
  function nearbyTextNode(node, offset) {
    for (;;) {
      if (node.nodeType == 3) { return node }
      if (node.nodeType == 1 && offset > 0) {
        if (node.childNodes.length > offset && node.childNodes[offset].nodeType == 3)
          { return node.childNodes[offset] }
        node = node.childNodes[offset - 1];
        offset = nodeSize(node);
      } else if (node.nodeType == 1 && offset < node.childNodes.length) {
        node = node.childNodes[offset];
        offset = 0;
      } else {
        return null
      }
    }
  }
  function findTextInFragment(frag, text, from, to) {
    for (var i = 0, pos = 0; i < frag.childCount && pos <= to;) {
      var child = frag.child(i++), childStart = pos;
      pos += child.nodeSize;
      if (!child.isText) { continue }
      var str = child.text;
      while (i < frag.childCount) {
        var next = frag.child(i++);
        pos += next.nodeSize;
        if (!next.isText) { break }
        str += next.text;
      }
      if (pos >= from) {
        var found = childStart < to ? str.lastIndexOf(text, to - childStart - 1) : -1;
        if (found >= 0 && found + text.length + childStart >= from)
          { return childStart + found }
        if (from == to && str.length >= (to + text.length) - childStart &&
            str.slice(to - childStart, to - childStart + text.length) == text)
          { return to }
      }
    }
    return -1
  }
  function replaceNodes(nodes, from, to, view, replacement) {
    var result = [];
    for (var i = 0, off = 0; i < nodes.length; i++) {
      var child = nodes[i], start = off, end = off += child.size;
      if (start >= to || end <= from) {
        result.push(child);
      } else {
        if (start < from) { result.push(child.slice(0, from - start, view)); }
        if (replacement) {
          result.push(replacement);
          replacement = null;
        }
        if (end > to) { result.push(child.slice(to - start, child.size, view)); }
      }
    }
    return result
  }
  function selectionFromDOM(view, origin) {
    var domSel = view.root.getSelection(), doc = view.state.doc;
    if (!domSel.focusNode) { return null }
    var nearestDesc = view.docView.nearestDesc(domSel.focusNode), inWidget = nearestDesc && nearestDesc.size == 0;
    var head = view.docView.posFromDOM(domSel.focusNode, domSel.focusOffset);
    if (head < 0) { return null }
    var $head = doc.resolve(head), $anchor, selection;
    if (selectionCollapsed(domSel)) {
      $anchor = $head;
      while (nearestDesc && !nearestDesc.node) { nearestDesc = nearestDesc.parent; }
      if (nearestDesc && nearestDesc.node.isAtom && NodeSelection.isSelectable(nearestDesc.node) && nearestDesc.parent
          && !(nearestDesc.node.isInline && isOnEdge(domSel.focusNode, domSel.focusOffset, nearestDesc.dom))) {
        var pos = nearestDesc.posBefore;
        selection = new NodeSelection(head == pos ? $head : doc.resolve(pos));
      }
    } else {
      var anchor = view.docView.posFromDOM(domSel.anchorNode, domSel.anchorOffset);
      if (anchor < 0) { return null }
      $anchor = doc.resolve(anchor);
    }
    if (!selection) {
      var bias = origin == "pointer" || (view.state.selection.head < $head.pos && !inWidget) ? 1 : -1;
      selection = selectionBetween(view, $anchor, $head, bias);
    }
    return selection
  }
  function editorOwnsSelection(view) {
    return view.editable ? view.hasFocus() :
      hasSelection(view) && document.activeElement && document.activeElement.contains(view.dom)
  }
  function selectionToDOM(view, force) {
    var sel = view.state.selection;
    syncNodeSelection(view, sel);
    if (!editorOwnsSelection(view)) { return }
    if (!force && view.mouseDown && view.mouseDown.allowDefault && result.chrome) {
      var domSel = view.root.getSelection(), curSel = view.domObserver.currentSelection;
      if (domSel.anchorNode && isEquivalentPosition(domSel.anchorNode, domSel.anchorOffset,
                                                    curSel.anchorNode, curSel.anchorOffset)) {
        view.mouseDown.delayedSelectionSync = true;
        view.domObserver.setCurSelection();
        return
      }
    }
    view.domObserver.disconnectSelection();
    if (view.cursorWrapper) {
      selectCursorWrapper(view);
    } else {
      var anchor = sel.anchor;
      var head = sel.head;
      var resetEditableFrom, resetEditableTo;
      if (brokenSelectBetweenUneditable && !(sel instanceof TextSelection)) {
        if (!sel.$from.parent.inlineContent)
          { resetEditableFrom = temporarilyEditableNear(view, sel.from); }
        if (!sel.empty && !sel.$from.parent.inlineContent)
          { resetEditableTo = temporarilyEditableNear(view, sel.to); }
      }
      view.docView.setSelection(anchor, head, view.root, force);
      if (brokenSelectBetweenUneditable) {
        if (resetEditableFrom) { resetEditable(resetEditableFrom); }
        if (resetEditableTo) { resetEditable(resetEditableTo); }
      }
      if (sel.visible) {
        view.dom.classList.remove("ProseMirror-hideselection");
      } else {
        view.dom.classList.add("ProseMirror-hideselection");
        if ("onselectionchange" in document) { removeClassOnSelectionChange(view); }
      }
    }
    view.domObserver.setCurSelection();
    view.domObserver.connectSelection();
  }
  var brokenSelectBetweenUneditable = result.safari || result.chrome && result.chrome_version < 63;
  function temporarilyEditableNear(view, pos) {
    var ref = view.docView.domFromPos(pos, 0);
    var node = ref.node;
    var offset = ref.offset;
    var after = offset < node.childNodes.length ? node.childNodes[offset] : null;
    var before = offset ? node.childNodes[offset - 1] : null;
    if (result.safari && after && after.contentEditable == "false") { return setEditable(after) }
    if ((!after || after.contentEditable == "false") && (!before || before.contentEditable == "false")) {
      if (after) { return setEditable(after) }
      else if (before) { return setEditable(before) }
    }
  }
  function setEditable(element) {
    element.contentEditable = "true";
    if (result.safari && element.draggable) { element.draggable = false; element.wasDraggable = true; }
    return element
  }
  function resetEditable(element) {
    element.contentEditable = "false";
    if (element.wasDraggable) { element.draggable = true; element.wasDraggable = null; }
  }
  function removeClassOnSelectionChange(view) {
    var doc = view.dom.ownerDocument;
    doc.removeEventListener("selectionchange", view.hideSelectionGuard);
    var domSel = view.root.getSelection();
    var node = domSel.anchorNode, offset = domSel.anchorOffset;
    doc.addEventListener("selectionchange", view.hideSelectionGuard = function () {
      if (domSel.anchorNode != node || domSel.anchorOffset != offset) {
        doc.removeEventListener("selectionchange", view.hideSelectionGuard);
        setTimeout(function () {
          if (!editorOwnsSelection(view) || view.state.selection.visible)
            { view.dom.classList.remove("ProseMirror-hideselection"); }
        }, 20);
      }
    });
  }
  function selectCursorWrapper(view) {
    var domSel = view.root.getSelection(), range = document.createRange();
    var node = view.cursorWrapper.dom, img = node.nodeName == "IMG";
    if (img) { range.setEnd(node.parentNode, domIndex(node) + 1); }
    else { range.setEnd(node, 0); }
    range.collapse(false);
    domSel.removeAllRanges();
    domSel.addRange(range);
    if (!img && !view.state.selection.visible && result.ie && result.ie_version <= 11) {
      node.disabled = true;
      node.disabled = false;
    }
  }
  function syncNodeSelection(view, sel) {
    if (sel instanceof NodeSelection) {
      var desc = view.docView.descAt(sel.from);
      if (desc != view.lastSelectedViewDesc) {
        clearNodeSelection(view);
        if (desc) { desc.selectNode(); }
        view.lastSelectedViewDesc = desc;
      }
    } else {
      clearNodeSelection(view);
    }
  }
  function clearNodeSelection(view) {
    if (view.lastSelectedViewDesc) {
      if (view.lastSelectedViewDesc.parent)
        { view.lastSelectedViewDesc.deselectNode(); }
      view.lastSelectedViewDesc = null;
    }
  }
  function selectionBetween(view, $anchor, $head, bias) {
    return view.someProp("createSelectionBetween", function (f) { return f(view, $anchor, $head); })
      || TextSelection.between($anchor, $head, bias)
  }
  function hasFocusAndSelection(view) {
    if (view.editable && view.root.activeElement != view.dom) { return false }
    return hasSelection(view)
  }
  function hasSelection(view) {
    var sel = view.root.getSelection();
    if (!sel.anchorNode) { return false }
    try {
      return view.dom.contains(sel.anchorNode.nodeType == 3 ? sel.anchorNode.parentNode : sel.anchorNode) &&
        (view.editable || view.dom.contains(sel.focusNode.nodeType == 3 ? sel.focusNode.parentNode : sel.focusNode))
    } catch(_) {
      return false
    }
  }
  function anchorInRightPlace(view) {
    var anchorDOM = view.docView.domFromPos(view.state.selection.anchor, 0);
    var domSel = view.root.getSelection();
    return isEquivalentPosition(anchorDOM.node, anchorDOM.offset, domSel.anchorNode, domSel.anchorOffset)
  }
  function moveSelectionBlock(state, dir) {
    var ref = state.selection;
    var $anchor = ref.$anchor;
    var $head = ref.$head;
    var $side = dir > 0 ? $anchor.max($head) : $anchor.min($head);
    var $start = !$side.parent.inlineContent ? $side : $side.depth ? state.doc.resolve(dir > 0 ? $side.after() : $side.before()) : null;
    return $start && Selection.findFrom($start, dir)
  }
  function apply(view, sel) {
    view.dispatch(view.state.tr.setSelection(sel).scrollIntoView());
    return true
  }
  function selectHorizontally(view, dir, mods) {
    var sel = view.state.selection;
    if (sel instanceof TextSelection) {
      if (!sel.empty || mods.indexOf("s") > -1) {
        return false
      } else if (view.endOfTextblock(dir > 0 ? "right" : "left")) {
        var next = moveSelectionBlock(view.state, dir);
        if (next && (next instanceof NodeSelection)) { return apply(view, next) }
        return false
      } else if (!(result.mac && mods.indexOf("m") > -1)) {
        var $head = sel.$head, node = $head.textOffset ? null : dir < 0 ? $head.nodeBefore : $head.nodeAfter, desc;
        if (!node || node.isText) { return false }
        var nodePos = dir < 0 ? $head.pos - node.nodeSize : $head.pos;
        if (!(node.isAtom || (desc = view.docView.descAt(nodePos)) && !desc.contentDOM)) { return false }
        if (NodeSelection.isSelectable(node)) {
          return apply(view, new NodeSelection(dir < 0 ? view.state.doc.resolve($head.pos - node.nodeSize) : $head))
        } else if (result.webkit) {
          return apply(view, new TextSelection(view.state.doc.resolve(dir < 0 ? nodePos : nodePos + node.nodeSize)))
        } else {
          return false
        }
      }
    } else if (sel instanceof NodeSelection && sel.node.isInline) {
      return apply(view, new TextSelection(dir > 0 ? sel.$to : sel.$from))
    } else {
      var next$1 = moveSelectionBlock(view.state, dir);
      if (next$1) { return apply(view, next$1) }
      return false
    }
  }
  function nodeLen(node) {
    return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length
  }
  function isIgnorable(dom) {
    var desc = dom.pmViewDesc;
    return desc && desc.size == 0 && (dom.nextSibling || dom.nodeName != "BR")
  }
  function skipIgnoredNodesLeft(view) {
    var sel = view.root.getSelection();
    var node = sel.focusNode, offset = sel.focusOffset;
    if (!node) { return }
    var moveNode, moveOffset, force = false;
    if (result.gecko && node.nodeType == 1 && offset < nodeLen(node) && isIgnorable(node.childNodes[offset])) { force = true; }
    for (;;) {
      if (offset > 0) {
        if (node.nodeType != 1) {
          break
        } else {
          var before = node.childNodes[offset - 1];
          if (isIgnorable(before)) {
            moveNode = node;
            moveOffset = --offset;
          } else if (before.nodeType == 3) {
            node = before;
            offset = node.nodeValue.length;
          } else { break }
        }
      } else if (isBlockNode(node)) {
        break
      } else {
        var prev = node.previousSibling;
        while (prev && isIgnorable(prev)) {
          moveNode = node.parentNode;
          moveOffset = domIndex(prev);
          prev = prev.previousSibling;
        }
        if (!prev) {
          node = node.parentNode;
          if (node == view.dom) { break }
          offset = 0;
        } else {
          node = prev;
          offset = nodeLen(node);
        }
      }
    }
    if (force) { setSelFocus(view, sel, node, offset); }
    else if (moveNode) { setSelFocus(view, sel, moveNode, moveOffset); }
  }
  function skipIgnoredNodesRight(view) {
    var sel = view.root.getSelection();
    var node = sel.focusNode, offset = sel.focusOffset;
    if (!node) { return }
    var len = nodeLen(node);
    var moveNode, moveOffset;
    for (;;) {
      if (offset < len) {
        if (node.nodeType != 1) { break }
        var after = node.childNodes[offset];
        if (isIgnorable(after)) {
          moveNode = node;
          moveOffset = ++offset;
        }
        else { break }
      } else if (isBlockNode(node)) {
        break
      } else {
        var next = node.nextSibling;
        while (next && isIgnorable(next)) {
          moveNode = next.parentNode;
          moveOffset = domIndex(next) + 1;
          next = next.nextSibling;
        }
        if (!next) {
          node = node.parentNode;
          if (node == view.dom) { break }
          offset = len = 0;
        } else {
          node = next;
          offset = 0;
          len = nodeLen(node);
        }
      }
    }
    if (moveNode) { setSelFocus(view, sel, moveNode, moveOffset); }
  }
  function isBlockNode(dom) {
    var desc = dom.pmViewDesc;
    return desc && desc.node && desc.node.isBlock
  }
  function setSelFocus(view, sel, node, offset) {
    if (selectionCollapsed(sel)) {
      var range = document.createRange();
      range.setEnd(node, offset);
      range.setStart(node, offset);
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (sel.extend) {
      sel.extend(node, offset);
    }
    view.domObserver.setCurSelection();
    var state = view.state;
    setTimeout(function () {
      if (view.state == state) { selectionToDOM(view); }
    }, 50);
  }
  function selectVertically(view, dir, mods) {
    var sel = view.state.selection;
    if (sel instanceof TextSelection && !sel.empty || mods.indexOf("s") > -1) { return false }
    if (result.mac && mods.indexOf("m") > -1) { return false }
    var $from = sel.$from;
    var $to = sel.$to;
    if (!$from.parent.inlineContent || view.endOfTextblock(dir < 0 ? "up" : "down")) {
      var next = moveSelectionBlock(view.state, dir);
      if (next && (next instanceof NodeSelection))
        { return apply(view, next) }
    }
    if (!$from.parent.inlineContent) {
      var side = dir < 0 ? $from : $to;
      var beyond = sel instanceof AllSelection ? Selection.near(side, dir) : Selection.findFrom(side, dir);
      return beyond ? apply(view, beyond) : false
    }
    return false
  }
  function stopNativeHorizontalDelete(view, dir) {
    if (!(view.state.selection instanceof TextSelection)) { return true }
    var ref = view.state.selection;
    var $head = ref.$head;
    var $anchor = ref.$anchor;
    var empty = ref.empty;
    if (!$head.sameParent($anchor)) { return true }
    if (!empty) { return false }
    if (view.endOfTextblock(dir > 0 ? "forward" : "backward")) { return true }
    var nextNode = !$head.textOffset && (dir < 0 ? $head.nodeBefore : $head.nodeAfter);
    if (nextNode && !nextNode.isText) {
      var tr = view.state.tr;
      if (dir < 0) { tr.delete($head.pos - nextNode.nodeSize, $head.pos); }
      else { tr.delete($head.pos, $head.pos + nextNode.nodeSize); }
      view.dispatch(tr);
      return true
    }
    return false
  }
  function switchEditable(view, node, state) {
    view.domObserver.stop();
    node.contentEditable = state;
    view.domObserver.start();
  }
  function safariDownArrowBug(view) {
    if (!result.safari || view.state.selection.$head.parentOffset > 0) { return }
    var ref = view.root.getSelection();
    var focusNode = ref.focusNode;
    var focusOffset = ref.focusOffset;
    if (focusNode && focusNode.nodeType == 1 && focusOffset == 0 &&
        focusNode.firstChild && focusNode.firstChild.contentEditable == "false") {
      var child = focusNode.firstChild;
      switchEditable(view, child, true);
      setTimeout(function () { return switchEditable(view, child, false); }, 20);
    }
  }
  function getMods(event) {
    var result = "";
    if (event.ctrlKey) { result += "c"; }
    if (event.metaKey) { result += "m"; }
    if (event.altKey) { result += "a"; }
    if (event.shiftKey) { result += "s"; }
    return result
  }
  function captureKeyDown(view, event) {
    var code = event.keyCode, mods = getMods(event);
    if (code == 8 || (result.mac && code == 72 && mods == "c")) {
      return stopNativeHorizontalDelete(view, -1) || skipIgnoredNodesLeft(view)
    } else if (code == 46 || (result.mac && code == 68 && mods == "c")) {
      return stopNativeHorizontalDelete(view, 1) || skipIgnoredNodesRight(view)
    } else if (code == 13 || code == 27) {
      return true
    } else if (code == 37) {
      return selectHorizontally(view, -1, mods) || skipIgnoredNodesLeft(view)
    } else if (code == 39) {
      return selectHorizontally(view, 1, mods) || skipIgnoredNodesRight(view)
    } else if (code == 38) {
      return selectVertically(view, -1, mods) || skipIgnoredNodesLeft(view)
    } else if (code == 40) {
      return safariDownArrowBug(view) || selectVertically(view, 1, mods) || skipIgnoredNodesRight(view)
    } else if (mods == (result.mac ? "m" : "c") &&
               (code == 66 || code == 73 || code == 89 || code == 90)) {
      return true
    }
    return false
  }
  function parseBetween(view, from_, to_) {
    var ref = view.docView.parseRange(from_, to_);
    var parent = ref.node;
    var fromOffset = ref.fromOffset;
    var toOffset = ref.toOffset;
    var from = ref.from;
    var to = ref.to;
    var domSel = view.root.getSelection(), find = null, anchor = domSel.anchorNode;
    if (anchor && view.dom.contains(anchor.nodeType == 1 ? anchor : anchor.parentNode)) {
      find = [{node: anchor, offset: domSel.anchorOffset}];
      if (!selectionCollapsed(domSel))
        { find.push({node: domSel.focusNode, offset: domSel.focusOffset}); }
    }
    if (result.chrome && view.lastKeyCode === 8) {
      for (var off = toOffset; off > fromOffset; off--) {
        var node = parent.childNodes[off - 1], desc = node.pmViewDesc;
        if (node.nodeName == "BR" && !desc) { toOffset = off; break }
        if (!desc || desc.size) { break }
      }
    }
    var startDoc = view.state.doc;
    var parser = view.someProp("domParser") || DOMParser.fromSchema(view.state.schema);
    var $from = startDoc.resolve(from);
    var sel = null, doc = parser.parse(parent, {
      topNode: $from.parent,
      topMatch: $from.parent.contentMatchAt($from.index()),
      topOpen: true,
      from: fromOffset,
      to: toOffset,
      preserveWhitespace: $from.parent.type.whitespace == "pre" ? "full" : true,
      editableContent: true,
      findPositions: find,
      ruleFromNode: ruleFromNode,
      context: $from
    });
    if (find && find[0].pos != null) {
      var anchor$1 = find[0].pos, head = find[1] && find[1].pos;
      if (head == null) { head = anchor$1; }
      sel = {anchor: anchor$1 + from, head: head + from};
    }
    return {doc: doc, sel: sel, from: from, to: to}
  }
  function ruleFromNode(dom) {
    var desc = dom.pmViewDesc;
    if (desc) {
      return desc.parseRule()
    } else if (dom.nodeName == "BR" && dom.parentNode) {
      if (result.safari && /^(ul|ol)$/i.test(dom.parentNode.nodeName)) {
        var skip = document.createElement("div");
        skip.appendChild(document.createElement("li"));
        return {skip: skip}
      } else if (dom.parentNode.lastChild == dom || result.safari && /^(tr|table)$/i.test(dom.parentNode.nodeName)) {
        return {ignore: true}
      }
    } else if (dom.nodeName == "IMG" && dom.getAttribute("mark-placeholder")) {
      return {ignore: true}
    }
  }
  function readDOMChange(view, from, to, typeOver, addedNodes) {
    if (from < 0) {
      var origin = view.lastSelectionTime > Date.now() - 50 ? view.lastSelectionOrigin : null;
      var newSel = selectionFromDOM(view, origin);
      if (newSel && !view.state.selection.eq(newSel)) {
        var tr$1 = view.state.tr.setSelection(newSel);
        if (origin == "pointer") { tr$1.setMeta("pointer", true); }
        else if (origin == "key") { tr$1.scrollIntoView(); }
        view.dispatch(tr$1);
      }
      return
    }
    var $before = view.state.doc.resolve(from);
    var shared = $before.sharedDepth(to);
    from = $before.before(shared + 1);
    to = view.state.doc.resolve(to).after(shared + 1);
    var sel = view.state.selection;
    var parse = parseBetween(view, from, to);
    if (result.chrome && view.cursorWrapper && parse.sel && parse.sel.anchor == view.cursorWrapper.deco.from) {
      var text = view.cursorWrapper.deco.type.toDOM.nextSibling;
      var size = text && text.nodeValue ? text.nodeValue.length : 1;
      parse.sel = {anchor: parse.sel.anchor + size, head: parse.sel.anchor + size};
    }
    var doc = view.state.doc, compare = doc.slice(parse.from, parse.to);
    var preferredPos, preferredSide;
    if (view.lastKeyCode === 8 && Date.now() - 100 < view.lastKeyCodeTime) {
      preferredPos = view.state.selection.to;
      preferredSide = "end";
    } else {
      preferredPos = view.state.selection.from;
      preferredSide = "start";
    }
    view.lastKeyCode = null;
    var change = findDiff(compare.content, parse.doc.content, parse.from, preferredPos, preferredSide);
    if (!change) {
      if (typeOver && sel instanceof TextSelection && !sel.empty && sel.$head.sameParent(sel.$anchor) &&
          !view.composing && !(parse.sel && parse.sel.anchor != parse.sel.head)) {
        change = {start: sel.from, endA: sel.to, endB: sel.to};
      } else if ((result.ios && view.lastIOSEnter > Date.now() - 225 || result.android) &&
                 addedNodes.some(function (n) { return n.nodeName == "DIV" || n.nodeName == "P"; }) &&
                 view.someProp("handleKeyDown", function (f) { return f(view, keyEvent(13, "Enter")); })) {
        view.lastIOSEnter = 0;
        return
      } else {
        if (parse.sel) {
          var sel$1 = resolveSelection(view, view.state.doc, parse.sel);
          if (sel$1 && !sel$1.eq(view.state.selection)) { view.dispatch(view.state.tr.setSelection(sel$1)); }
        }
        return
      }
    }
    view.domChangeCount++;
    if (view.state.selection.from < view.state.selection.to &&
        change.start == change.endB &&
        view.state.selection instanceof TextSelection) {
      if (change.start > view.state.selection.from && change.start <= view.state.selection.from + 2 &&
          view.state.selection.from >= parse.from) {
        change.start = view.state.selection.from;
      } else if (change.endA < view.state.selection.to && change.endA >= view.state.selection.to - 2 &&
                 view.state.selection.to <= parse.to) {
        change.endB += (view.state.selection.to - change.endA);
        change.endA = view.state.selection.to;
      }
    }
    if (result.ie && result.ie_version <= 11 && change.endB == change.start + 1 &&
        change.endA == change.start && change.start > parse.from &&
        parse.doc.textBetween(change.start - parse.from - 1, change.start - parse.from + 1) == " \u00a0") {
      change.start--;
      change.endA--;
      change.endB--;
    }
    var $from = parse.doc.resolveNoCache(change.start - parse.from);
    var $to = parse.doc.resolveNoCache(change.endB - parse.from);
    var inlineChange = $from.sameParent($to) && $from.parent.inlineContent;
    var nextSel;
    if (((result.ios && view.lastIOSEnter > Date.now() - 225 &&
          (!inlineChange || addedNodes.some(function (n) { return n.nodeName == "DIV" || n.nodeName == "P"; }))) ||
         (!inlineChange && $from.pos < parse.doc.content.size &&
          (nextSel = Selection.findFrom(parse.doc.resolve($from.pos + 1), 1, true)) &&
          nextSel.head == $to.pos)) &&
        view.someProp("handleKeyDown", function (f) { return f(view, keyEvent(13, "Enter")); })) {
      view.lastIOSEnter = 0;
      return
    }
    if (view.state.selection.anchor > change.start &&
        looksLikeJoin(doc, change.start, change.endA, $from, $to) &&
        view.someProp("handleKeyDown", function (f) { return f(view, keyEvent(8, "Backspace")); })) {
      if (result.android && result.chrome) { view.domObserver.suppressSelectionUpdates(); }
      return
    }
    if (result.chrome && result.android && change.toB == change.from)
      { view.lastAndroidDelete = Date.now(); }
    if (result.android && !inlineChange && $from.start() != $to.start() && $to.parentOffset == 0 && $from.depth == $to.depth &&
        parse.sel && parse.sel.anchor == parse.sel.head && parse.sel.head == change.endA) {
      change.endB -= 2;
      $to = parse.doc.resolveNoCache(change.endB - parse.from);
      setTimeout(function () {
        view.someProp("handleKeyDown", function (f) { return f(view, keyEvent(13, "Enter")); });
      }, 20);
    }
    var chFrom = change.start, chTo = change.endA;
    var tr, storedMarks, markChange, $from1;
    if (inlineChange) {
      if ($from.pos == $to.pos) {
        if (result.ie && result.ie_version <= 11 && $from.parentOffset == 0) {
          view.domObserver.suppressSelectionUpdates();
          setTimeout(function () { return selectionToDOM(view); }, 20);
        }
        tr = view.state.tr.delete(chFrom, chTo);
        storedMarks = doc.resolve(change.start).marksAcross(doc.resolve(change.endA));
      } else if (
        change.endA == change.endB && ($from1 = doc.resolve(change.start)) &&
        (markChange = isMarkChange($from.parent.content.cut($from.parentOffset, $to.parentOffset),
                                   $from1.parent.content.cut($from1.parentOffset, change.endA - $from1.start())))
      ) {
        tr = view.state.tr;
        if (markChange.type == "add") { tr.addMark(chFrom, chTo, markChange.mark); }
        else { tr.removeMark(chFrom, chTo, markChange.mark); }
      } else if ($from.parent.child($from.index()).isText && $from.index() == $to.index() - ($to.textOffset ? 0 : 1)) {
        var text$1 = $from.parent.textBetween($from.parentOffset, $to.parentOffset);
        if (view.someProp("handleTextInput", function (f) { return f(view, chFrom, chTo, text$1); })) { return }
        tr = view.state.tr.insertText(text$1, chFrom, chTo);
      }
    }
    if (!tr)
      { tr = view.state.tr.replace(chFrom, chTo, parse.doc.slice(change.start - parse.from, change.endB - parse.from)); }
    if (parse.sel) {
      var sel$2 = resolveSelection(view, tr.doc, parse.sel);
      if (sel$2 && !(result.chrome && result.android && view.composing && sel$2.empty &&
                   (change.start != change.endB || view.lastAndroidDelete < Date.now() - 100) &&
                   (sel$2.head == chFrom || sel$2.head == tr.mapping.map(chTo) - 1) ||
                   result.ie && sel$2.empty && sel$2.head == chFrom))
        { tr.setSelection(sel$2); }
    }
    if (storedMarks) { tr.ensureMarks(storedMarks); }
    view.dispatch(tr.scrollIntoView());
  }
  function resolveSelection(view, doc, parsedSel) {
    if (Math.max(parsedSel.anchor, parsedSel.head) > doc.content.size) { return null }
    return selectionBetween(view, doc.resolve(parsedSel.anchor), doc.resolve(parsedSel.head))
  }
  function isMarkChange(cur, prev) {
    var curMarks = cur.firstChild.marks, prevMarks = prev.firstChild.marks;
    var added = curMarks, removed = prevMarks, type, mark, update;
    for (var i = 0; i < prevMarks.length; i++) { added = prevMarks[i].removeFromSet(added); }
    for (var i$1 = 0; i$1 < curMarks.length; i$1++) { removed = curMarks[i$1].removeFromSet(removed); }
    if (added.length == 1 && removed.length == 0) {
      mark = added[0];
      type = "add";
      update = function (node) { return node.mark(mark.addToSet(node.marks)); };
    } else if (added.length == 0 && removed.length == 1) {
      mark = removed[0];
      type = "remove";
      update = function (node) { return node.mark(mark.removeFromSet(node.marks)); };
    } else {
      return null
    }
    var updated = [];
    for (var i$2 = 0; i$2 < prev.childCount; i$2++) { updated.push(update(prev.child(i$2))); }
    if (Fragment.from(updated).eq(cur)) { return {mark: mark, type: type} }
  }
  function looksLikeJoin(old, start, end, $newStart, $newEnd) {
    if (!$newStart.parent.isTextblock ||
        end - start <= $newEnd.pos - $newStart.pos ||
        skipClosingAndOpening($newStart, true, false) < $newEnd.pos)
      { return false }
    var $start = old.resolve(start);
    if ($start.parentOffset < $start.parent.content.size || !$start.parent.isTextblock)
      { return false }
    var $next = old.resolve(skipClosingAndOpening($start, true, true));
    if (!$next.parent.isTextblock || $next.pos > end ||
        skipClosingAndOpening($next, true, false) < end)
      { return false }
    return $newStart.parent.content.cut($newStart.parentOffset).eq($next.parent.content)
  }
  function skipClosingAndOpening($pos, fromEnd, mayOpen) {
    var depth = $pos.depth, end = fromEnd ? $pos.end() : $pos.pos;
    while (depth > 0 && (fromEnd || $pos.indexAfter(depth) == $pos.node(depth).childCount)) {
      depth--;
      end++;
      fromEnd = false;
    }
    if (mayOpen) {
      var next = $pos.node(depth).maybeChild($pos.indexAfter(depth));
      while (next && !next.isLeaf) {
        next = next.firstChild;
        end++;
      }
    }
    return end
  }
  function findDiff(a, b, pos, preferredPos, preferredSide) {
    var start = a.findDiffStart(b, pos);
    if (start == null) { return null }
    var ref = a.findDiffEnd(b, pos + a.size, pos + b.size);
    var endA = ref.a;
    var endB = ref.b;
    if (preferredSide == "end") {
      var adjust = Math.max(0, start - Math.min(endA, endB));
      preferredPos -= endA + adjust - start;
    }
    if (endA < start && a.size < b.size) {
      var move = preferredPos <= start && preferredPos >= endA ? start - preferredPos : 0;
      start -= move;
      endB = start + (endB - endA);
      endA = start;
    } else if (endB < start) {
      var move$1 = preferredPos <= start && preferredPos >= endB ? start - preferredPos : 0;
      start -= move$1;
      endA = start + (endA - endB);
      endB = start;
    }
    return {start: start, endA: endA, endB: endB}
  }
  function serializeForClipboard(view, slice) {
    var context = [];
    var content = slice.content;
    var openStart = slice.openStart;
    var openEnd = slice.openEnd;
    while (openStart > 1 && openEnd > 1 && content.childCount == 1 && content.firstChild.childCount == 1) {
      openStart--;
      openEnd--;
      var node = content.firstChild;
      context.push(node.type.name, node.attrs != node.type.defaultAttrs ? node.attrs : null);
      content = node.content;
    }
    var serializer = view.someProp("clipboardSerializer") || DOMSerializer.fromSchema(view.state.schema);
    var doc = detachedDoc(), wrap = doc.createElement("div");
    wrap.appendChild(serializer.serializeFragment(content, {document: doc}));
    var firstChild = wrap.firstChild, needsWrap;
    while (firstChild && firstChild.nodeType == 1 && (needsWrap = wrapMap[firstChild.nodeName.toLowerCase()])) {
      for (var i = needsWrap.length - 1; i >= 0; i--) {
        var wrapper = doc.createElement(needsWrap[i]);
        while (wrap.firstChild) { wrapper.appendChild(wrap.firstChild); }
        wrap.appendChild(wrapper);
        if (needsWrap[i] != "tbody") {
          openStart++;
          openEnd++;
        }
      }
      firstChild = wrap.firstChild;
    }
    if (firstChild && firstChild.nodeType == 1)
      { firstChild.setAttribute("data-pm-slice", (openStart + " " + openEnd + " " + (JSON.stringify(context)))); }
    var text = view.someProp("clipboardTextSerializer", function (f) { return f(slice); }) ||
        slice.content.textBetween(0, slice.content.size, "\n\n");
    return {dom: wrap, text: text}
  }
  function parseFromClipboard(view, text, html, plainText, $context) {
    var dom, inCode = $context.parent.type.spec.code, slice;
    if (!html && !text) { return null }
    var asText = text && (plainText || inCode || !html);
    if (asText) {
      view.someProp("transformPastedText", function (f) { text = f(text, inCode || plainText); });
      if (inCode) { return text ? new Slice(Fragment.from(view.state.schema.text(text.replace(/\r\n?/g, "\n"))), 0, 0) : Slice.empty }
      var parsed = view.someProp("clipboardTextParser", function (f) { return f(text, $context, plainText); });
      if (parsed) {
        slice = parsed;
      } else {
        var marks = $context.marks();
        var ref = view.state;
        var schema = ref.schema;
        var serializer = DOMSerializer.fromSchema(schema);
        dom = document.createElement("div");
        text.split(/(?:\r\n?|\n)+/).forEach(function (block) {
          var p = dom.appendChild(document.createElement("p"));
          if (block) { p.appendChild(serializer.serializeNode(schema.text(block, marks))); }
        });
      }
    } else {
      view.someProp("transformPastedHTML", function (f) { html = f(html); });
      dom = readHTML(html);
      if (result.webkit) { restoreReplacedSpaces(dom); }
    }
    var contextNode = dom && dom.querySelector("[data-pm-slice]");
    var sliceData = contextNode && /^(\d+) (\d+) (.*)/.exec(contextNode.getAttribute("data-pm-slice"));
    if (!slice) {
      var parser = view.someProp("clipboardParser") || view.someProp("domParser") || DOMParser.fromSchema(view.state.schema);
      slice = parser.parseSlice(dom, {
        preserveWhitespace: !!(asText || sliceData),
        context: $context,
        ruleFromNode: function ruleFromNode(dom) {
          if (dom.nodeName == "BR" && !dom.nextSibling &&
              dom.parentNode && !inlineParents.test(dom.parentNode.nodeName)) { return {ignore: true} }
        }
      });
    }
    if (sliceData) {
      slice = addContext(closeSlice(slice, +sliceData[1], +sliceData[2]), sliceData[3]);
    } else {
      slice = Slice.maxOpen(normalizeSiblings(slice.content, $context), true);
      if (slice.openStart || slice.openEnd) {
        var openStart = 0, openEnd = 0;
        for (var node = slice.content.firstChild; openStart < slice.openStart && !node.type.spec.isolating;
             openStart++, node = node.firstChild) {}
        for (var node$1 = slice.content.lastChild; openEnd < slice.openEnd && !node$1.type.spec.isolating;
             openEnd++, node$1 = node$1.lastChild) {}
        slice = closeSlice(slice, openStart, openEnd);
      }
    }
    view.someProp("transformPasted", function (f) { slice = f(slice); });
    return slice
  }
  var inlineParents = /^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var)$/i;
  function normalizeSiblings(fragment, $context) {
    if (fragment.childCount < 2) { return fragment }
    var loop = function ( d ) {
      var parent = $context.node(d);
      var match = parent.contentMatchAt($context.index(d));
      var lastWrap = (void 0), result = [];
      fragment.forEach(function (node) {
        if (!result) { return }
        var wrap = match.findWrapping(node.type), inLast;
        if (!wrap) { return result = null }
        if (inLast = result.length && lastWrap.length && addToSibling(wrap, lastWrap, node, result[result.length - 1], 0)) {
          result[result.length - 1] = inLast;
        } else {
          if (result.length) { result[result.length - 1] = closeRight(result[result.length - 1], lastWrap.length); }
          var wrapped = withWrappers(node, wrap);
          result.push(wrapped);
          match = match.matchType(wrapped.type, wrapped.attrs);
          lastWrap = wrap;
        }
      });
      if (result) { return { v: Fragment.from(result) } }
    };
    for (var d = $context.depth; d >= 0; d--) {
      var returned = loop( d );
      if ( returned ) return returned.v;
    }
    return fragment
  }
  function withWrappers(node, wrap, from) {
    if ( from === void 0 ) from = 0;
    for (var i = wrap.length - 1; i >= from; i--)
      { node = wrap[i].create(null, Fragment.from(node)); }
    return node
  }
  function addToSibling(wrap, lastWrap, node, sibling, depth) {
    if (depth < wrap.length && depth < lastWrap.length && wrap[depth] == lastWrap[depth]) {
      var inner = addToSibling(wrap, lastWrap, node, sibling.lastChild, depth + 1);
      if (inner) { return sibling.copy(sibling.content.replaceChild(sibling.childCount - 1, inner)) }
      var match = sibling.contentMatchAt(sibling.childCount);
      if (match.matchType(depth == wrap.length - 1 ? node.type : wrap[depth + 1]))
        { return sibling.copy(sibling.content.append(Fragment.from(withWrappers(node, wrap, depth + 1)))) }
    }
  }
  function closeRight(node, depth) {
    if (depth == 0) { return node }
    var fragment = node.content.replaceChild(node.childCount - 1, closeRight(node.lastChild, depth - 1));
    var fill = node.contentMatchAt(node.childCount).fillBefore(Fragment.empty, true);
    return node.copy(fragment.append(fill))
  }
  function closeRange(fragment, side, from, to, depth, openEnd) {
    var node = side < 0 ? fragment.firstChild : fragment.lastChild, inner = node.content;
    if (depth < to - 1) { inner = closeRange(inner, side, from, to, depth + 1, openEnd); }
    if (depth >= from)
      { inner = side < 0 ? node.contentMatchAt(0).fillBefore(inner, fragment.childCount > 1 || openEnd <= depth).append(inner)
        : inner.append(node.contentMatchAt(node.childCount).fillBefore(Fragment.empty, true)); }
    return fragment.replaceChild(side < 0 ? 0 : fragment.childCount - 1, node.copy(inner))
  }
  function closeSlice(slice, openStart, openEnd) {
    if (openStart < slice.openStart)
      { slice = new Slice(closeRange(slice.content, -1, openStart, slice.openStart, 0, slice.openEnd), openStart, slice.openEnd); }
    if (openEnd < slice.openEnd)
      { slice = new Slice(closeRange(slice.content, 1, openEnd, slice.openEnd, 0, 0), slice.openStart, openEnd); }
    return slice
  }
  var wrapMap = {
    thead: ["table"],
    tbody: ["table"],
    tfoot: ["table"],
    caption: ["table"],
    colgroup: ["table"],
    col: ["table", "colgroup"],
    tr: ["table", "tbody"],
    td: ["table", "tbody", "tr"],
    th: ["table", "tbody", "tr"]
  };
  var _detachedDoc = null;
  function detachedDoc() {
    return _detachedDoc || (_detachedDoc = document.implementation.createHTMLDocument("title"))
  }
  function readHTML(html) {
    var metas = /^(\s*<meta [^>]*>)*/.exec(html);
    if (metas) { html = html.slice(metas[0].length); }
    var elt = detachedDoc().createElement("div");
    var firstTag = /<([a-z][^>\s]+)/i.exec(html), wrap;
    if (wrap = firstTag && wrapMap[firstTag[1].toLowerCase()])
      { html = wrap.map(function (n) { return "<" + n + ">"; }).join("") + html + wrap.map(function (n) { return "</" + n + ">"; }).reverse().join(""); }
    elt.innerHTML = html;
    if (wrap) { for (var i = 0; i < wrap.length; i++) { elt = elt.querySelector(wrap[i]) || elt; } }
    return elt
  }
  function restoreReplacedSpaces(dom) {
    var nodes = dom.querySelectorAll(result.chrome ? "span:not([class]):not([style])" : "span.Apple-converted-space");
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.childNodes.length == 1 && node.textContent == "\u00a0" && node.parentNode)
        { node.parentNode.replaceChild(dom.ownerDocument.createTextNode(" "), node); }
    }
  }
  function addContext(slice, context) {
    if (!slice.size) { return slice }
    var schema = slice.content.firstChild.type.schema, array;
    try { array = JSON.parse(context); }
    catch(e) { return slice }
    var content = slice.content;
    var openStart = slice.openStart;
    var openEnd = slice.openEnd;
    for (var i = array.length - 2; i >= 0; i -= 2) {
      var type = schema.nodes[array[i]];
      if (!type || type.hasRequiredAttrs()) { break }
      content = Fragment.from(type.create(array[i + 1], content));
      openStart++; openEnd++;
    }
    return new Slice(content, openStart, openEnd)
  }
  var observeOptions = {
    childList: true,
    characterData: true,
    characterDataOldValue: true,
    attributes: true,
    attributeOldValue: true,
    subtree: true
  };
  var useCharData = result.ie && result.ie_version <= 11;
  var SelectionState = function SelectionState() {
    this.anchorNode = this.anchorOffset = this.focusNode = this.focusOffset = null;
  };
  SelectionState.prototype.set = function set (sel) {
    this.anchorNode = sel.anchorNode; this.anchorOffset = sel.anchorOffset;
    this.focusNode = sel.focusNode; this.focusOffset = sel.focusOffset;
  };
  SelectionState.prototype.eq = function eq (sel) {
    return sel.anchorNode == this.anchorNode && sel.anchorOffset == this.anchorOffset &&
      sel.focusNode == this.focusNode && sel.focusOffset == this.focusOffset
  };
  var DOMObserver = function DOMObserver(view, handleDOMChange) {
    var this$1$1 = this;
    this.view = view;
    this.handleDOMChange = handleDOMChange;
    this.queue = [];
    this.flushingSoon = -1;
    this.observer = window.MutationObserver &&
      new window.MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) { this$1$1.queue.push(mutations[i]); }
        if (result.ie && result.ie_version <= 11 && mutations.some(
          function (m) { return m.type == "childList" && m.removedNodes.length ||
               m.type == "characterData" && m.oldValue.length > m.target.nodeValue.length; }))
          { this$1$1.flushSoon(); }
        else
          { this$1$1.flush(); }
      });
    this.currentSelection = new SelectionState;
    if (useCharData) {
      this.onCharData = function (e) {
        this$1$1.queue.push({target: e.target, type: "characterData", oldValue: e.prevValue});
        this$1$1.flushSoon();
      };
    }
    this.onSelectionChange = this.onSelectionChange.bind(this);
    this.suppressingSelectionUpdates = false;
  };
  DOMObserver.prototype.flushSoon = function flushSoon () {
      var this$1$1 = this;
    if (this.flushingSoon < 0)
      { this.flushingSoon = window.setTimeout(function () { this$1$1.flushingSoon = -1; this$1$1.flush(); }, 20); }
  };
  DOMObserver.prototype.forceFlush = function forceFlush () {
    if (this.flushingSoon > -1) {
      window.clearTimeout(this.flushingSoon);
      this.flushingSoon = -1;
      this.flush();
    }
  };
  DOMObserver.prototype.start = function start () {
    if (this.observer)
      { this.observer.observe(this.view.dom, observeOptions); }
    if (useCharData)
      { this.view.dom.addEventListener("DOMCharacterDataModified", this.onCharData); }
    this.connectSelection();
  };
  DOMObserver.prototype.stop = function stop () {
      var this$1$1 = this;
    if (this.observer) {
      var take = this.observer.takeRecords();
      if (take.length) {
        for (var i = 0; i < take.length; i++) { this.queue.push(take[i]); }
        window.setTimeout(function () { return this$1$1.flush(); }, 20);
      }
      this.observer.disconnect();
    }
    if (useCharData) { this.view.dom.removeEventListener("DOMCharacterDataModified", this.onCharData); }
    this.disconnectSelection();
  };
  DOMObserver.prototype.connectSelection = function connectSelection () {
    this.view.dom.ownerDocument.addEventListener("selectionchange", this.onSelectionChange);
  };
  DOMObserver.prototype.disconnectSelection = function disconnectSelection () {
    this.view.dom.ownerDocument.removeEventListener("selectionchange", this.onSelectionChange);
  };
  DOMObserver.prototype.suppressSelectionUpdates = function suppressSelectionUpdates () {
      var this$1$1 = this;
    this.suppressingSelectionUpdates = true;
    setTimeout(function () { return this$1$1.suppressingSelectionUpdates = false; }, 50);
  };
  DOMObserver.prototype.onSelectionChange = function onSelectionChange () {
    if (!hasFocusAndSelection(this.view)) { return }
    if (this.suppressingSelectionUpdates) { return selectionToDOM(this.view) }
    if (result.ie && result.ie_version <= 11 && !this.view.state.selection.empty) {
      var sel = this.view.root.getSelection();
      if (sel.focusNode && isEquivalentPosition(sel.focusNode, sel.focusOffset, sel.anchorNode, sel.anchorOffset))
        { return this.flushSoon() }
    }
    this.flush();
  };
  DOMObserver.prototype.setCurSelection = function setCurSelection () {
    this.currentSelection.set(this.view.root.getSelection());
  };
  DOMObserver.prototype.ignoreSelectionChange = function ignoreSelectionChange (sel) {
    if (sel.rangeCount == 0) { return true }
    var container = sel.getRangeAt(0).commonAncestorContainer;
    var desc = this.view.docView.nearestDesc(container);
    if (desc && desc.ignoreMutation({type: "selection", target: container.nodeType == 3 ? container.parentNode : container})) {
      this.setCurSelection();
      return true
    }
  };
  DOMObserver.prototype.flush = function flush () {
    if (!this.view.docView || this.flushingSoon > -1) { return }
    var mutations = this.observer ? this.observer.takeRecords() : [];
    if (this.queue.length) {
      mutations = this.queue.concat(mutations);
      this.queue.length = 0;
    }
    var sel = this.view.root.getSelection();
    var newSel = !this.suppressingSelectionUpdates && !this.currentSelection.eq(sel) && hasSelection(this.view) && !this.ignoreSelectionChange(sel);
    var from = -1, to = -1, typeOver = false, added = [];
    if (this.view.editable) {
      for (var i = 0; i < mutations.length; i++) {
        var result$1 = this.registerMutation(mutations[i], added);
        if (result$1) {
          from = from < 0 ? result$1.from : Math.min(result$1.from, from);
          to = to < 0 ? result$1.to : Math.max(result$1.to, to);
          if (result$1.typeOver) { typeOver = true; }
        }
      }
    }
    if (result.gecko && added.length > 1) {
      var brs = added.filter(function (n) { return n.nodeName == "BR"; });
      if (brs.length == 2) {
        var a = brs[0];
          var b = brs[1];
        if (a.parentNode && a.parentNode.parentNode == b.parentNode) { b.remove(); }
        else { a.remove(); }
      }
    }
    if (from > -1 || newSel) {
      if (from > -1) {
        this.view.docView.markDirty(from, to);
        checkCSS(this.view);
      }
      this.handleDOMChange(from, to, typeOver, added);
      if (this.view.docView && this.view.docView.dirty) { this.view.updateState(this.view.state); }
      else if (!this.currentSelection.eq(sel)) { selectionToDOM(this.view); }
      this.currentSelection.set(sel);
    }
  };
  DOMObserver.prototype.registerMutation = function registerMutation (mut, added) {
    if (added.indexOf(mut.target) > -1) { return null }
    var desc = this.view.docView.nearestDesc(mut.target);
    if (mut.type == "attributes" &&
        (desc == this.view.docView || mut.attributeName == "contenteditable" ||
         (mut.attributeName == "style" && !mut.oldValue && !mut.target.getAttribute("style"))))
      { return null }
    if (!desc || desc.ignoreMutation(mut)) { return null }
    if (mut.type == "childList") {
      for (var i = 0; i < mut.addedNodes.length; i++) { added.push(mut.addedNodes[i]); }
      if (desc.contentDOM && desc.contentDOM != desc.dom && !desc.contentDOM.contains(mut.target))
        { return {from: desc.posBefore, to: desc.posAfter} }
      var prev = mut.previousSibling, next = mut.nextSibling;
      if (result.ie && result.ie_version <= 11 && mut.addedNodes.length) {
        for (var i$1 = 0; i$1 < mut.addedNodes.length; i$1++) {
          var ref = mut.addedNodes[i$1];
            var previousSibling = ref.previousSibling;
            var nextSibling = ref.nextSibling;
          if (!previousSibling || Array.prototype.indexOf.call(mut.addedNodes, previousSibling) < 0) { prev = previousSibling; }
          if (!nextSibling || Array.prototype.indexOf.call(mut.addedNodes, nextSibling) < 0) { next = nextSibling; }
        }
      }
      var fromOffset = prev && prev.parentNode == mut.target
          ? domIndex(prev) + 1 : 0;
      var from = desc.localPosFromDOM(mut.target, fromOffset, -1);
      var toOffset = next && next.parentNode == mut.target
          ? domIndex(next) : mut.target.childNodes.length;
      var to = desc.localPosFromDOM(mut.target, toOffset, 1);
      return {from: from, to: to}
    } else if (mut.type == "attributes") {
      return {from: desc.posAtStart - desc.border, to: desc.posAtEnd + desc.border}
    } else {
      return {
        from: desc.posAtStart,
        to: desc.posAtEnd,
        typeOver: mut.target.nodeValue == mut.oldValue
      }
    }
  };
  var cssChecked = false;
  function checkCSS(view) {
    if (cssChecked) { return }
    cssChecked = true;
    if (getComputedStyle(view.dom).whiteSpace == "normal")
      { console["warn"]("ProseMirror expects the CSS white-space property to be set, preferably to 'pre-wrap'. It is recommended to load style/prosemirror.css from the prosemirror-view package."); }
  }
  var handlers = {}, editHandlers = {};
  function initInput(view) {
    view.shiftKey = false;
    view.mouseDown = null;
    view.lastKeyCode = null;
    view.lastKeyCodeTime = 0;
    view.lastClick = {time: 0, x: 0, y: 0, type: ""};
    view.lastSelectionOrigin = null;
    view.lastSelectionTime = 0;
    view.lastIOSEnter = 0;
    view.lastIOSEnterFallbackTimeout = null;
    view.lastAndroidDelete = 0;
    view.composing = false;
    view.composingTimeout = null;
    view.compositionNodes = [];
    view.compositionEndedAt = -2e8;
    view.domObserver = new DOMObserver(view, function (from, to, typeOver, added) { return readDOMChange(view, from, to, typeOver, added); });
    view.domObserver.start();
    view.domChangeCount = 0;
    view.eventHandlers = Object.create(null);
    var loop = function ( event ) {
      var handler = handlers[event];
      view.dom.addEventListener(event, view.eventHandlers[event] = function (event) {
        if (eventBelongsToView(view, event) && !runCustomHandler(view, event) &&
            (view.editable || !(event.type in editHandlers)))
          { handler(view, event); }
      });
    };
    for (var event in handlers) loop( event );
    if (result.safari) { view.dom.addEventListener("input", function () { return null; }); }
    ensureListeners(view);
  }
  function setSelectionOrigin(view, origin) {
    view.lastSelectionOrigin = origin;
    view.lastSelectionTime = Date.now();
  }
  function destroyInput(view) {
    view.domObserver.stop();
    for (var type in view.eventHandlers)
      { view.dom.removeEventListener(type, view.eventHandlers[type]); }
    clearTimeout(view.composingTimeout);
    clearTimeout(view.lastIOSEnterFallbackTimeout);
  }
  function ensureListeners(view) {
    view.someProp("handleDOMEvents", function (currentHandlers) {
      for (var type in currentHandlers) { if (!view.eventHandlers[type])
        { view.dom.addEventListener(type, view.eventHandlers[type] = function (event) { return runCustomHandler(view, event); }); } }
    });
  }
  function runCustomHandler(view, event) {
    return view.someProp("handleDOMEvents", function (handlers) {
      var handler = handlers[event.type];
      return handler ? handler(view, event) || event.defaultPrevented : false
    })
  }
  function eventBelongsToView(view, event) {
    if (!event.bubbles) { return true }
    if (event.defaultPrevented) { return false }
    for (var node = event.target; node != view.dom; node = node.parentNode)
      { if (!node || node.nodeType == 11 ||
          (node.pmViewDesc && node.pmViewDesc.stopEvent(event)))
        { return false } }
    return true
  }
  function dispatchEvent(view, event) {
    if (!runCustomHandler(view, event) && handlers[event.type] &&
        (view.editable || !(event.type in editHandlers)))
      { handlers[event.type](view, event); }
  }
  editHandlers.keydown = function (view, event) {
    view.shiftKey = event.keyCode == 16 || event.shiftKey;
    if (inOrNearComposition(view, event)) { return }
    view.lastKeyCode = event.keyCode;
    view.lastKeyCodeTime = Date.now();
    if (result.android && result.chrome && event.keyCode == 13) { return }
    if (event.keyCode != 229) { view.domObserver.forceFlush(); }
    if (result.ios && event.keyCode == 13 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      var now = Date.now();
      view.lastIOSEnter = now;
      view.lastIOSEnterFallbackTimeout = setTimeout(function () {
        if (view.lastIOSEnter == now) {
          view.someProp("handleKeyDown", function (f) { return f(view, keyEvent(13, "Enter")); });
          view.lastIOSEnter = 0;
        }
      }, 200);
    } else if (view.someProp("handleKeyDown", function (f) { return f(view, event); }) || captureKeyDown(view, event)) {
      event.preventDefault();
    } else {
      setSelectionOrigin(view, "key");
    }
  };
  editHandlers.keyup = function (view, e) {
    if (e.keyCode == 16) { view.shiftKey = false; }
  };
  editHandlers.keypress = function (view, event) {
    if (inOrNearComposition(view, event) || !event.charCode ||
        event.ctrlKey && !event.altKey || result.mac && event.metaKey) { return }
    if (view.someProp("handleKeyPress", function (f) { return f(view, event); })) {
      event.preventDefault();
      return
    }
    var sel = view.state.selection;
    if (!(sel instanceof TextSelection) || !sel.$from.sameParent(sel.$to)) {
      var text = String.fromCharCode(event.charCode);
      if (!view.someProp("handleTextInput", function (f) { return f(view, sel.$from.pos, sel.$to.pos, text); }))
        { view.dispatch(view.state.tr.insertText(text).scrollIntoView()); }
      event.preventDefault();
    }
  };
  function eventCoords(event) { return {left: event.clientX, top: event.clientY} }
  function isNear(event, click) {
    var dx = click.x - event.clientX, dy = click.y - event.clientY;
    return dx * dx + dy * dy < 100
  }
  function runHandlerOnContext(view, propName, pos, inside, event) {
    if (inside == -1) { return false }
    var $pos = view.state.doc.resolve(inside);
    var loop = function ( i ) {
      if (view.someProp(propName, function (f) { return i > $pos.depth ? f(view, pos, $pos.nodeAfter, $pos.before(i), event, true)
                                                      : f(view, pos, $pos.node(i), $pos.before(i), event, false); }))
        { return { v: true } }
    };
    for (var i = $pos.depth + 1; i > 0; i--) {
      var returned = loop( i );
      if ( returned ) return returned.v;
    }
    return false
  }
  function updateSelection(view, selection, origin) {
    if (!view.focused) { view.focus(); }
    var tr = view.state.tr.setSelection(selection);
    if (origin == "pointer") { tr.setMeta("pointer", true); }
    view.dispatch(tr);
  }
  function selectClickedLeaf(view, inside) {
    if (inside == -1) { return false }
    var $pos = view.state.doc.resolve(inside), node = $pos.nodeAfter;
    if (node && node.isAtom && NodeSelection.isSelectable(node)) {
      updateSelection(view, new NodeSelection($pos), "pointer");
      return true
    }
    return false
  }
  function selectClickedNode(view, inside) {
    if (inside == -1) { return false }
    var sel = view.state.selection, selectedNode, selectAt;
    if (sel instanceof NodeSelection) { selectedNode = sel.node; }
    var $pos = view.state.doc.resolve(inside);
    for (var i = $pos.depth + 1; i > 0; i--) {
      var node = i > $pos.depth ? $pos.nodeAfter : $pos.node(i);
      if (NodeSelection.isSelectable(node)) {
        if (selectedNode && sel.$from.depth > 0 &&
            i >= sel.$from.depth && $pos.before(sel.$from.depth + 1) == sel.$from.pos)
          { selectAt = $pos.before(sel.$from.depth); }
        else
          { selectAt = $pos.before(i); }
        break
      }
    }
    if (selectAt != null) {
      updateSelection(view, NodeSelection.create(view.state.doc, selectAt), "pointer");
      return true
    } else {
      return false
    }
  }
  function handleSingleClick(view, pos, inside, event, selectNode) {
    return runHandlerOnContext(view, "handleClickOn", pos, inside, event) ||
      view.someProp("handleClick", function (f) { return f(view, pos, event); }) ||
      (selectNode ? selectClickedNode(view, inside) : selectClickedLeaf(view, inside))
  }
  function handleDoubleClick(view, pos, inside, event) {
    return runHandlerOnContext(view, "handleDoubleClickOn", pos, inside, event) ||
      view.someProp("handleDoubleClick", function (f) { return f(view, pos, event); })
  }
  function handleTripleClick(view, pos, inside, event) {
    return runHandlerOnContext(view, "handleTripleClickOn", pos, inside, event) ||
      view.someProp("handleTripleClick", function (f) { return f(view, pos, event); }) ||
      defaultTripleClick(view, inside, event)
  }
  function defaultTripleClick(view, inside, event) {
    if (event.button != 0) { return false }
    var doc = view.state.doc;
    if (inside == -1) {
      if (doc.inlineContent) {
        updateSelection(view, TextSelection.create(doc, 0, doc.content.size), "pointer");
        return true
      }
      return false
    }
    var $pos = doc.resolve(inside);
    for (var i = $pos.depth + 1; i > 0; i--) {
      var node = i > $pos.depth ? $pos.nodeAfter : $pos.node(i);
      var nodePos = $pos.before(i);
      if (node.inlineContent)
        { updateSelection(view, TextSelection.create(doc, nodePos + 1, nodePos + 1 + node.content.size), "pointer"); }
      else if (NodeSelection.isSelectable(node))
        { updateSelection(view, NodeSelection.create(doc, nodePos), "pointer"); }
      else
        { continue }
      return true
    }
  }
  function forceDOMFlush(view) {
    return endComposition(view)
  }
  var selectNodeModifier = result.mac ? "metaKey" : "ctrlKey";
  handlers.mousedown = function (view, event) {
    view.shiftKey = event.shiftKey;
    var flushed = forceDOMFlush(view);
    var now = Date.now(), type = "singleClick";
    if (now - view.lastClick.time < 500 && isNear(event, view.lastClick) && !event[selectNodeModifier]) {
      if (view.lastClick.type == "singleClick") { type = "doubleClick"; }
      else if (view.lastClick.type == "doubleClick") { type = "tripleClick"; }
    }
    view.lastClick = {time: now, x: event.clientX, y: event.clientY, type: type};
    var pos = view.posAtCoords(eventCoords(event));
    if (!pos) { return }
    if (type == "singleClick") {
      if (view.mouseDown) { view.mouseDown.done(); }
      view.mouseDown = new MouseDown(view, pos, event, flushed);
    } else if ((type == "doubleClick" ? handleDoubleClick : handleTripleClick)(view, pos.pos, pos.inside, event)) {
      event.preventDefault();
    } else {
      setSelectionOrigin(view, "pointer");
    }
  };
  var MouseDown = function MouseDown(view, pos, event, flushed) {
    var this$1$1 = this;
    this.view = view;
    this.startDoc = view.state.doc;
    this.pos = pos;
    this.event = event;
    this.flushed = flushed;
    this.selectNode = event[selectNodeModifier];
    this.allowDefault = event.shiftKey;
    this.delayedSelectionSync = false;
    var targetNode, targetPos;
    if (pos.inside > -1) {
      targetNode = view.state.doc.nodeAt(pos.inside);
      targetPos = pos.inside;
    } else {
      var $pos = view.state.doc.resolve(pos.pos);
      targetNode = $pos.parent;
      targetPos = $pos.depth ? $pos.before() : 0;
    }
    this.mightDrag = null;
    var target = flushed ? null : event.target;
    var targetDesc = target ? view.docView.nearestDesc(target, true) : null;
    this.target = targetDesc ? targetDesc.dom : null;
    var ref = view.state;
    var selection = ref.selection;
    if (event.button == 0 &&
        targetNode.type.spec.draggable && targetNode.type.spec.selectable !== false ||
        selection instanceof NodeSelection && selection.from <= targetPos && selection.to > targetPos)
      { this.mightDrag = {node: targetNode,
                        pos: targetPos,
                        addAttr: this.target && !this.target.draggable,
                        setUneditable: this.target && result.gecko && !this.target.hasAttribute("contentEditable")}; }
    if (this.target && this.mightDrag && (this.mightDrag.addAttr || this.mightDrag.setUneditable)) {
      this.view.domObserver.stop();
      if (this.mightDrag.addAttr) { this.target.draggable = true; }
      if (this.mightDrag.setUneditable)
        { setTimeout(function () {
          if (this$1$1.view.mouseDown == this$1$1) { this$1$1.target.setAttribute("contentEditable", "false"); }
        }, 20); }
      this.view.domObserver.start();
    }
    view.root.addEventListener("mouseup", this.up = this.up.bind(this));
    view.root.addEventListener("mousemove", this.move = this.move.bind(this));
    setSelectionOrigin(view, "pointer");
  };
  MouseDown.prototype.done = function done () {
      var this$1$1 = this;
    this.view.root.removeEventListener("mouseup", this.up);
    this.view.root.removeEventListener("mousemove", this.move);
    if (this.mightDrag && this.target) {
      this.view.domObserver.stop();
      if (this.mightDrag.addAttr) { this.target.removeAttribute("draggable"); }
      if (this.mightDrag.setUneditable) { this.target.removeAttribute("contentEditable"); }
      this.view.domObserver.start();
    }
    if (this.delayedSelectionSync) { setTimeout(function () { return selectionToDOM(this$1$1.view); }); }
    this.view.mouseDown = null;
  };
  MouseDown.prototype.up = function up (event) {
    this.done();
    if (!this.view.dom.contains(event.target.nodeType == 3 ? event.target.parentNode : event.target))
      { return }
    var pos = this.pos;
    if (this.view.state.doc != this.startDoc) { pos = this.view.posAtCoords(eventCoords(event)); }
    if (this.allowDefault || !pos) {
      setSelectionOrigin(this.view, "pointer");
    } else if (handleSingleClick(this.view, pos.pos, pos.inside, event, this.selectNode)) {
      event.preventDefault();
    } else if (event.button == 0 &&
               (this.flushed ||
                (result.safari && this.mightDrag && !this.mightDrag.node.isAtom) ||
                (result.chrome && !(this.view.state.selection instanceof TextSelection) &&
                 Math.min(Math.abs(pos.pos - this.view.state.selection.from),
                          Math.abs(pos.pos - this.view.state.selection.to)) <= 2))) {
      updateSelection(this.view, Selection.near(this.view.state.doc.resolve(pos.pos)), "pointer");
      event.preventDefault();
    } else {
      setSelectionOrigin(this.view, "pointer");
    }
  };
  MouseDown.prototype.move = function move (event) {
    if (!this.allowDefault && (Math.abs(this.event.x - event.clientX) > 4 ||
                               Math.abs(this.event.y - event.clientY) > 4))
      { this.allowDefault = true; }
    setSelectionOrigin(this.view, "pointer");
    if (event.buttons == 0) { this.done(); }
  };
  handlers.touchdown = function (view) {
    forceDOMFlush(view);
    setSelectionOrigin(view, "pointer");
  };
  handlers.contextmenu = function (view) { return forceDOMFlush(view); };
  function inOrNearComposition(view, event) {
    if (view.composing) { return true }
    if (result.safari && Math.abs(event.timeStamp - view.compositionEndedAt) < 500) {
      view.compositionEndedAt = -2e8;
      return true
    }
    return false
  }
  var timeoutComposition = result.android ? 5000 : -1;
  editHandlers.compositionstart = editHandlers.compositionupdate = function (view) {
    if (!view.composing) {
      view.domObserver.flush();
      var state = view.state;
      var $pos = state.selection.$from;
      if (state.selection.empty &&
          (state.storedMarks ||
           (!$pos.textOffset && $pos.parentOffset && $pos.nodeBefore.marks.some(function (m) { return m.type.spec.inclusive === false; })))) {
        view.markCursor = view.state.storedMarks || $pos.marks();
        endComposition(view, true);
        view.markCursor = null;
      } else {
        endComposition(view);
        if (result.gecko && state.selection.empty && $pos.parentOffset && !$pos.textOffset && $pos.nodeBefore.marks.length) {
          var sel = view.root.getSelection();
          for (var node = sel.focusNode, offset = sel.focusOffset; node && node.nodeType == 1 && offset != 0;) {
            var before = offset < 0 ? node.lastChild : node.childNodes[offset - 1];
            if (!before) { break }
            if (before.nodeType == 3) {
              sel.collapse(before, before.nodeValue.length);
              break
            } else {
              node = before;
              offset = -1;
            }
          }
        }
      }
      view.composing = true;
    }
    scheduleComposeEnd(view, timeoutComposition);
  };
  editHandlers.compositionend = function (view, event) {
    if (view.composing) {
      view.composing = false;
      view.compositionEndedAt = event.timeStamp;
      scheduleComposeEnd(view, 20);
    }
  };
  function scheduleComposeEnd(view, delay) {
    clearTimeout(view.composingTimeout);
    if (delay > -1) { view.composingTimeout = setTimeout(function () { return endComposition(view); }, delay); }
  }
  function clearComposition(view) {
    if (view.composing) {
      view.composing = false;
      view.compositionEndedAt = timestampFromCustomEvent();
    }
    while (view.compositionNodes.length > 0) { view.compositionNodes.pop().markParentsDirty(); }
  }
  function timestampFromCustomEvent() {
    var event = document.createEvent("Event");
    event.initEvent("event", true, true);
    return event.timeStamp
  }
  function endComposition(view, forceUpdate) {
    if (result.android && view.domObserver.flushingSoon >= 0) { return }
    view.domObserver.forceFlush();
    clearComposition(view);
    if (forceUpdate || view.docView && view.docView.dirty) {
      var sel = selectionFromDOM(view);
      if (sel && !sel.eq(view.state.selection)) { view.dispatch(view.state.tr.setSelection(sel)); }
      else { view.updateState(view.state); }
      return true
    }
    return false
  }
  function captureCopy(view, dom) {
    if (!view.dom.parentNode) { return }
    var wrap = view.dom.parentNode.appendChild(document.createElement("div"));
    wrap.appendChild(dom);
    wrap.style.cssText = "position: fixed; left: -10000px; top: 10px";
    var sel = getSelection(), range = document.createRange();
    range.selectNodeContents(dom);
    view.dom.blur();
    sel.removeAllRanges();
    sel.addRange(range);
    setTimeout(function () {
      if (wrap.parentNode) { wrap.parentNode.removeChild(wrap); }
      view.focus();
    }, 50);
  }
  var brokenClipboardAPI = (result.ie && result.ie_version < 15) ||
        (result.ios && result.webkit_version < 604);
  handlers.copy = editHandlers.cut = function (view, e) {
    var sel = view.state.selection, cut = e.type == "cut";
    if (sel.empty) { return }
    var data = brokenClipboardAPI ? null : e.clipboardData;
    var slice = sel.content();
    var ref = serializeForClipboard(view, slice);
    var dom = ref.dom;
    var text = ref.text;
    if (data) {
      e.preventDefault();
      data.clearData();
      data.setData("text/html", dom.innerHTML);
      data.setData("text/plain", text);
    } else {
      captureCopy(view, dom);
    }
    if (cut) { view.dispatch(view.state.tr.deleteSelection().scrollIntoView().setMeta("uiEvent", "cut")); }
  };
  function sliceSingleNode(slice) {
    return slice.openStart == 0 && slice.openEnd == 0 && slice.content.childCount == 1 ? slice.content.firstChild : null
  }
  function capturePaste(view, e) {
    if (!view.dom.parentNode) { return }
    var plainText = view.shiftKey || view.state.selection.$from.parent.type.spec.code;
    var target = view.dom.parentNode.appendChild(document.createElement(plainText ? "textarea" : "div"));
    if (!plainText) { target.contentEditable = "true"; }
    target.style.cssText = "position: fixed; left: -10000px; top: 10px";
    target.focus();
    setTimeout(function () {
      view.focus();
      if (target.parentNode) { target.parentNode.removeChild(target); }
      if (plainText) { doPaste(view, target.value, null, e); }
      else { doPaste(view, target.textContent, target.innerHTML, e); }
    }, 50);
  }
  function doPaste(view, text, html, e) {
    var slice = parseFromClipboard(view, text, html, view.shiftKey, view.state.selection.$from);
    if (view.someProp("handlePaste", function (f) { return f(view, e, slice || Slice.empty); })) { return true }
    if (!slice) { return false }
    var singleNode = sliceSingleNode(slice);
    var tr = singleNode ? view.state.tr.replaceSelectionWith(singleNode, view.shiftKey) : view.state.tr.replaceSelection(slice);
    view.dispatch(tr.scrollIntoView().setMeta("paste", true).setMeta("uiEvent", "paste"));
    return true
  }
  editHandlers.paste = function (view, e) {
    if (view.composing && !result.android) { return }
    var data = brokenClipboardAPI ? null : e.clipboardData;
    if (data && doPaste(view, data.getData("text/plain"), data.getData("text/html"), e)) { e.preventDefault(); }
    else { capturePaste(view, e); }
  };
  var Dragging = function Dragging(slice, move) {
    this.slice = slice;
    this.move = move;
  };
  var dragCopyModifier = result.mac ? "altKey" : "ctrlKey";
  handlers.dragstart = function (view, e) {
    var mouseDown = view.mouseDown;
    if (mouseDown) { mouseDown.done(); }
    if (!e.dataTransfer) { return }
    var sel = view.state.selection;
    var pos = sel.empty ? null : view.posAtCoords(eventCoords(e));
    if (pos && pos.pos >= sel.from && pos.pos <= (sel instanceof NodeSelection ? sel.to - 1: sel.to)) ; else if (mouseDown && mouseDown.mightDrag) {
      view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, mouseDown.mightDrag.pos)));
    } else if (e.target && e.target.nodeType == 1) {
      var desc = view.docView.nearestDesc(e.target, true);
      if (desc && desc.node.type.spec.draggable && desc != view.docView)
        { view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, desc.posBefore))); }
    }
    var slice = view.state.selection.content();
    var ref = serializeForClipboard(view, slice);
    var dom = ref.dom;
    var text = ref.text;
    e.dataTransfer.clearData();
    e.dataTransfer.setData(brokenClipboardAPI ? "Text" : "text/html", dom.innerHTML);
    e.dataTransfer.effectAllowed = "copyMove";
    if (!brokenClipboardAPI) { e.dataTransfer.setData("text/plain", text); }
    view.dragging = new Dragging(slice, !e[dragCopyModifier]);
  };
  handlers.dragend = function (view) {
    var dragging = view.dragging;
    window.setTimeout(function () {
      if (view.dragging == dragging)  { view.dragging = null; }
    }, 50);
  };
  editHandlers.dragover = editHandlers.dragenter = function (_, e) { return e.preventDefault(); };
  editHandlers.drop = function (view, e) {
    var dragging = view.dragging;
    view.dragging = null;
    if (!e.dataTransfer) { return }
    var eventPos = view.posAtCoords(eventCoords(e));
    if (!eventPos) { return }
    var $mouse = view.state.doc.resolve(eventPos.pos);
    if (!$mouse) { return }
    var slice = dragging && dragging.slice;
    if (slice) {
      view.someProp("transformPasted", function (f) { slice = f(slice); });
    } else {
      slice = parseFromClipboard(view, e.dataTransfer.getData(brokenClipboardAPI ? "Text" : "text/plain"),
                                 brokenClipboardAPI ? null : e.dataTransfer.getData("text/html"), false, $mouse);
    }
    var move = dragging && !e[dragCopyModifier];
    if (view.someProp("handleDrop", function (f) { return f(view, e, slice || Slice.empty, move); })) {
      e.preventDefault();
      return
    }
    if (!slice) { return }
    e.preventDefault();
    var insertPos = slice ? dropPoint(view.state.doc, $mouse.pos, slice) : $mouse.pos;
    if (insertPos == null) { insertPos = $mouse.pos; }
    var tr = view.state.tr;
    if (move) { tr.deleteSelection(); }
    var pos = tr.mapping.map(insertPos);
    var isNode = slice.openStart == 0 && slice.openEnd == 0 && slice.content.childCount == 1;
    var beforeInsert = tr.doc;
    if (isNode)
      { tr.replaceRangeWith(pos, pos, slice.content.firstChild); }
    else
      { tr.replaceRange(pos, pos, slice); }
    if (tr.doc.eq(beforeInsert)) { return }
    var $pos = tr.doc.resolve(pos);
    if (isNode && NodeSelection.isSelectable(slice.content.firstChild) &&
        $pos.nodeAfter && $pos.nodeAfter.sameMarkup(slice.content.firstChild)) {
      tr.setSelection(new NodeSelection($pos));
    } else {
      var end = tr.mapping.map(insertPos);
      tr.mapping.maps[tr.mapping.maps.length - 1].forEach(function (_from, _to, _newFrom, newTo) { return end = newTo; });
      tr.setSelection(selectionBetween(view, $pos, tr.doc.resolve(end)));
    }
    view.focus();
    view.dispatch(tr.setMeta("uiEvent", "drop"));
  };
  handlers.focus = function (view) {
    if (!view.focused) {
      view.domObserver.stop();
      view.dom.classList.add("ProseMirror-focused");
      view.domObserver.start();
      view.focused = true;
      setTimeout(function () {
        if (view.docView && view.hasFocus() && !view.domObserver.currentSelection.eq(view.root.getSelection()))
          { selectionToDOM(view); }
      }, 20);
    }
  };
  handlers.blur = function (view, e) {
    if (view.focused) {
      view.domObserver.stop();
      view.dom.classList.remove("ProseMirror-focused");
      view.domObserver.start();
      if (e.relatedTarget && view.dom.contains(e.relatedTarget))
        { view.domObserver.currentSelection.set({}); }
      view.focused = false;
    }
  };
  handlers.beforeinput = function (view, event) {
    if (result.chrome && result.android && event.inputType == "deleteContentBackward") {
      view.domObserver.flushSoon();
      var domChangeCount = view.domChangeCount;
      setTimeout(function () {
        if (view.domChangeCount != domChangeCount) { return }
        view.dom.blur();
        view.focus();
        if (view.someProp("handleKeyDown", function (f) { return f(view, keyEvent(8, "Backspace")); })) { return }
        var ref = view.state.selection;
        var $cursor = ref.$cursor;
        if ($cursor && $cursor.pos > 0) { view.dispatch(view.state.tr.delete($cursor.pos - 1, $cursor.pos).scrollIntoView()); }
      }, 50);
    }
  };
  for (var prop in editHandlers) { handlers[prop] = editHandlers[prop]; }
  function compareObjs(a, b) {
    if (a == b) { return true }
    for (var p in a) { if (a[p] !== b[p]) { return false } }
    for (var p$1 in b) { if (!(p$1 in a)) { return false } }
    return true
  }
  var WidgetType = function WidgetType(toDOM, spec) {
    this.spec = spec || noSpec;
    this.side = this.spec.side || 0;
    this.toDOM = toDOM;
  };
  WidgetType.prototype.map = function map (mapping, span, offset, oldOffset) {
    var ref = mapping.mapResult(span.from + oldOffset, this.side < 0 ? -1 : 1);
      var pos = ref.pos;
      var deleted = ref.deleted;
    return deleted ? null : new Decoration(pos - offset, pos - offset, this)
  };
  WidgetType.prototype.valid = function valid () { return true };
  WidgetType.prototype.eq = function eq (other) {
    return this == other ||
      (other instanceof WidgetType &&
       (this.spec.key && this.spec.key == other.spec.key ||
        this.toDOM == other.toDOM && compareObjs(this.spec, other.spec)))
  };
  WidgetType.prototype.destroy = function destroy (node) {
    if (this.spec.destroy) { this.spec.destroy(node); }
  };
  var InlineType = function InlineType(attrs, spec) {
    this.spec = spec || noSpec;
    this.attrs = attrs;
  };
  InlineType.prototype.map = function map (mapping, span, offset, oldOffset) {
    var from = mapping.map(span.from + oldOffset, this.spec.inclusiveStart ? -1 : 1) - offset;
    var to = mapping.map(span.to + oldOffset, this.spec.inclusiveEnd ? 1 : -1) - offset;
    return from >= to ? null : new Decoration(from, to, this)
  };
  InlineType.prototype.valid = function valid (_, span) { return span.from < span.to };
  InlineType.prototype.eq = function eq (other) {
    return this == other ||
      (other instanceof InlineType && compareObjs(this.attrs, other.attrs) &&
       compareObjs(this.spec, other.spec))
  };
  InlineType.is = function is (span) { return span.type instanceof InlineType };
  var NodeType = function NodeType(attrs, spec) {
    this.spec = spec || noSpec;
    this.attrs = attrs;
  };
  NodeType.prototype.map = function map (mapping, span, offset, oldOffset) {
    var from = mapping.mapResult(span.from + oldOffset, 1);
    if (from.deleted) { return null }
    var to = mapping.mapResult(span.to + oldOffset, -1);
    if (to.deleted || to.pos <= from.pos) { return null }
    return new Decoration(from.pos - offset, to.pos - offset, this)
  };
  NodeType.prototype.valid = function valid (node, span) {
    var ref = node.content.findIndex(span.from);
      var index = ref.index;
      var offset = ref.offset;
      var child;
    return offset == span.from && !(child = node.child(index)).isText && offset + child.nodeSize == span.to
  };
  NodeType.prototype.eq = function eq (other) {
    return this == other ||
      (other instanceof NodeType && compareObjs(this.attrs, other.attrs) &&
       compareObjs(this.spec, other.spec))
  };
  var Decoration = function Decoration(from, to, type) {
    this.from = from;
    this.to = to;
    this.type = type;
  };
  var prototypeAccessors$1 = { spec: { configurable: true },inline: { configurable: true } };
  Decoration.prototype.copy = function copy (from, to) {
    return new Decoration(from, to, this.type)
  };
  Decoration.prototype.eq = function eq (other, offset) {
      if ( offset === void 0 ) offset = 0;
    return this.type.eq(other.type) && this.from + offset == other.from && this.to + offset == other.to
  };
  Decoration.prototype.map = function map (mapping, offset, oldOffset) {
    return this.type.map(mapping, this, offset, oldOffset)
  };
  Decoration.widget = function widget (pos, toDOM, spec) {
    return new Decoration(pos, pos, new WidgetType(toDOM, spec))
  };
  Decoration.inline = function inline (from, to, attrs, spec) {
    return new Decoration(from, to, new InlineType(attrs, spec))
  };
  Decoration.node = function node (from, to, attrs, spec) {
    return new Decoration(from, to, new NodeType(attrs, spec))
  };
  prototypeAccessors$1.spec.get = function () { return this.type.spec };
  prototypeAccessors$1.inline.get = function () { return this.type instanceof InlineType };
  Object.defineProperties( Decoration.prototype, prototypeAccessors$1 );
  var none = [], noSpec = {};
  var DecorationSet = function DecorationSet(local, children) {
    this.local = local && local.length ? local : none;
    this.children = children && children.length ? children : none;
  };
  DecorationSet.create = function create (doc, decorations) {
    return decorations.length ? buildTree(decorations, doc, 0, noSpec) : empty
  };
  DecorationSet.prototype.find = function find (start, end, predicate) {
    var result = [];
    this.findInner(start == null ? 0 : start, end == null ? 1e9 : end, result, 0, predicate);
    return result
  };
  DecorationSet.prototype.findInner = function findInner (start, end, result, offset, predicate) {
    for (var i = 0; i < this.local.length; i++) {
      var span = this.local[i];
      if (span.from <= end && span.to >= start && (!predicate || predicate(span.spec)))
        { result.push(span.copy(span.from + offset, span.to + offset)); }
    }
    for (var i$1 = 0; i$1 < this.children.length; i$1 += 3) {
      if (this.children[i$1] < end && this.children[i$1 + 1] > start) {
        var childOff = this.children[i$1] + 1;
        this.children[i$1 + 2].findInner(start - childOff, end - childOff, result, offset + childOff, predicate);
      }
    }
  };
  DecorationSet.prototype.map = function map (mapping, doc, options) {
    if (this == empty || mapping.maps.length == 0) { return this }
    return this.mapInner(mapping, doc, 0, 0, options || noSpec)
  };
  DecorationSet.prototype.mapInner = function mapInner (mapping, node, offset, oldOffset, options) {
    var newLocal;
    for (var i = 0; i < this.local.length; i++) {
      var mapped = this.local[i].map(mapping, offset, oldOffset);
      if (mapped && mapped.type.valid(node, mapped)) { (newLocal || (newLocal = [])).push(mapped); }
      else if (options.onRemove) { options.onRemove(this.local[i].spec); }
    }
    if (this.children.length)
      { return mapChildren(this.children, newLocal, mapping, node, offset, oldOffset, options) }
    else
      { return newLocal ? new DecorationSet(newLocal.sort(byPos)) : empty }
  };
  DecorationSet.prototype.add = function add (doc, decorations) {
    if (!decorations.length) { return this }
    if (this == empty) { return DecorationSet.create(doc, decorations) }
    return this.addInner(doc, decorations, 0)
  };
  DecorationSet.prototype.addInner = function addInner (doc, decorations, offset) {
      var this$1$1 = this;
    var children, childIndex = 0;
    doc.forEach(function (childNode, childOffset) {
      var baseOffset = childOffset + offset, found;
      if (!(found = takeSpansForNode(decorations, childNode, baseOffset))) { return }
      if (!children) { children = this$1$1.children.slice(); }
      while (childIndex < children.length && children[childIndex] < childOffset) { childIndex += 3; }
      if (children[childIndex] == childOffset)
        { children[childIndex + 2] = children[childIndex + 2].addInner(childNode, found, baseOffset + 1); }
      else
        { children.splice(childIndex, 0, childOffset, childOffset + childNode.nodeSize, buildTree(found, childNode, baseOffset + 1, noSpec)); }
      childIndex += 3;
    });
    var local = moveSpans(childIndex ? withoutNulls(decorations) : decorations, -offset);
    for (var i = 0; i < local.length; i++) { if (!local[i].type.valid(doc, local[i])) { local.splice(i--, 1); } }
    return new DecorationSet(local.length ? this.local.concat(local).sort(byPos) : this.local,
                             children || this.children)
  };
  DecorationSet.prototype.remove = function remove (decorations) {
    if (decorations.length == 0 || this == empty) { return this }
    return this.removeInner(decorations, 0)
  };
  DecorationSet.prototype.removeInner = function removeInner (decorations, offset) {
    var children = this.children, local = this.local;
    for (var i = 0; i < children.length; i += 3) {
      var found = (void 0), from = children[i] + offset, to = children[i + 1] + offset;
      for (var j = 0, span = (void 0); j < decorations.length; j++) { if (span = decorations[j]) {
        if (span.from > from && span.to < to) {
          decorations[j] = null
          ;(found || (found = [])).push(span);
        }
      } }
      if (!found) { continue }
      if (children == this.children) { children = this.children.slice(); }
      var removed = children[i + 2].removeInner(found, from + 1);
      if (removed != empty) {
        children[i + 2] = removed;
      } else {
        children.splice(i, 3);
        i -= 3;
      }
    }
    if (local.length) { for (var i$1 = 0, span$1 = (void 0); i$1 < decorations.length; i$1++) { if (span$1 = decorations[i$1]) {
      for (var j$1 = 0; j$1 < local.length; j$1++) { if (local[j$1].eq(span$1, offset)) {
        if (local == this.local) { local = this.local.slice(); }
        local.splice(j$1--, 1);
      } }
    } } }
    if (children == this.children && local == this.local) { return this }
    return local.length || children.length ? new DecorationSet(local, children) : empty
  };
  DecorationSet.prototype.forChild = function forChild (offset, node) {
    if (this == empty) { return this }
    if (node.isLeaf) { return DecorationSet.empty }
    var child, local;
    for (var i = 0; i < this.children.length; i += 3) { if (this.children[i] >= offset) {
      if (this.children[i] == offset) { child = this.children[i + 2]; }
      break
    } }
    var start = offset + 1, end = start + node.content.size;
    for (var i$1 = 0; i$1 < this.local.length; i$1++) {
      var dec = this.local[i$1];
      if (dec.from < end && dec.to > start && (dec.type instanceof InlineType)) {
        var from = Math.max(start, dec.from) - start, to = Math.min(end, dec.to) - start;
        if (from < to) { (local || (local = [])).push(dec.copy(from, to)); }
      }
    }
    if (local) {
      var localSet = new DecorationSet(local.sort(byPos));
      return child ? new DecorationGroup([localSet, child]) : localSet
    }
    return child || empty
  };
  DecorationSet.prototype.eq = function eq (other) {
    if (this == other) { return true }
    if (!(other instanceof DecorationSet) ||
        this.local.length != other.local.length ||
        this.children.length != other.children.length) { return false }
    for (var i = 0; i < this.local.length; i++)
      { if (!this.local[i].eq(other.local[i])) { return false } }
    for (var i$1 = 0; i$1 < this.children.length; i$1 += 3)
      { if (this.children[i$1] != other.children[i$1] ||
          this.children[i$1 + 1] != other.children[i$1 + 1] ||
          !this.children[i$1 + 2].eq(other.children[i$1 + 2])) { return false } }
    return true
  };
  DecorationSet.prototype.locals = function locals (node) {
    return removeOverlap(this.localsInner(node))
  };
  DecorationSet.prototype.localsInner = function localsInner (node) {
    if (this == empty) { return none }
    if (node.inlineContent || !this.local.some(InlineType.is)) { return this.local }
    var result = [];
    for (var i = 0; i < this.local.length; i++) {
      if (!(this.local[i].type instanceof InlineType))
        { result.push(this.local[i]); }
    }
    return result
  };
  var empty = new DecorationSet();
  DecorationSet.empty = empty;
  DecorationSet.removeOverlap = removeOverlap;
  var DecorationGroup = function DecorationGroup(members) {
    this.members = members;
  };
  DecorationGroup.prototype.map = function map (mapping, doc) {
    var mappedDecos = this.members.map(
      function (member) { return member.map(mapping, doc, noSpec); }
    );
    return DecorationGroup.from(mappedDecos)
  };
  DecorationGroup.prototype.forChild = function forChild (offset, child) {
    if (child.isLeaf) { return DecorationSet.empty }
    var found = [];
    for (var i = 0; i < this.members.length; i++) {
      var result = this.members[i].forChild(offset, child);
      if (result == empty) { continue }
      if (result instanceof DecorationGroup) { found = found.concat(result.members); }
      else { found.push(result); }
    }
    return DecorationGroup.from(found)
  };
  DecorationGroup.prototype.eq = function eq (other) {
    if (!(other instanceof DecorationGroup) ||
        other.members.length != this.members.length) { return false }
    for (var i = 0; i < this.members.length; i++)
      { if (!this.members[i].eq(other.members[i])) { return false } }
    return true
  };
  DecorationGroup.prototype.locals = function locals (node) {
    var result, sorted = true;
    for (var i = 0; i < this.members.length; i++) {
      var locals = this.members[i].localsInner(node);
      if (!locals.length) { continue }
      if (!result) {
        result = locals;
      } else {
        if (sorted) {
          result = result.slice();
          sorted = false;
        }
        for (var j = 0; j < locals.length; j++) { result.push(locals[j]); }
      }
    }
    return result ? removeOverlap(sorted ? result : result.sort(byPos)) : none
  };
  DecorationGroup.from = function from (members) {
    switch (members.length) {
      case 0: return empty
      case 1: return members[0]
      default: return new DecorationGroup(members)
    }
  };
  function mapChildren(oldChildren, newLocal, mapping, node, offset, oldOffset, options) {
    var children = oldChildren.slice();
    var shift = function (oldStart, oldEnd, newStart, newEnd) {
      for (var i = 0; i < children.length; i += 3) {
        var end = children[i + 1], dSize = (void 0);
        if (end == -1 || oldStart > end + oldOffset) { continue }
        if (oldEnd >= children[i] + oldOffset) {
          children[i + 1] = -1;
        } else if (newStart >= offset && (dSize = (newEnd - newStart) - (oldEnd - oldStart))) {
          children[i] += dSize;
          children[i + 1] += dSize;
        }
      }
    };
    for (var i = 0; i < mapping.maps.length; i++) { mapping.maps[i].forEach(shift); }
    var mustRebuild = false;
    for (var i$1 = 0; i$1 < children.length; i$1 += 3) { if (children[i$1 + 1] == -1) {
      var from = mapping.map(oldChildren[i$1] + oldOffset), fromLocal = from - offset;
      if (fromLocal < 0 || fromLocal >= node.content.size) {
        mustRebuild = true;
        continue
      }
      var to = mapping.map(oldChildren[i$1 + 1] + oldOffset, -1), toLocal = to - offset;
      var ref = node.content.findIndex(fromLocal);
      var index = ref.index;
      var childOffset = ref.offset;
      var childNode = node.maybeChild(index);
      if (childNode && childOffset == fromLocal && childOffset + childNode.nodeSize == toLocal) {
        var mapped = children[i$1 + 2].mapInner(mapping, childNode, from + 1, oldChildren[i$1] + oldOffset + 1, options);
        if (mapped != empty) {
          children[i$1] = fromLocal;
          children[i$1 + 1] = toLocal;
          children[i$1 + 2] = mapped;
        } else {
          children[i$1 + 1] = -2;
          mustRebuild = true;
        }
      } else {
        mustRebuild = true;
      }
    } }
    if (mustRebuild) {
      var decorations = mapAndGatherRemainingDecorations(children, oldChildren, newLocal || [], mapping,
                                                         offset, oldOffset, options);
      var built = buildTree(decorations, node, 0, options);
      newLocal = built.local;
      for (var i$2 = 0; i$2 < children.length; i$2 += 3) { if (children[i$2 + 1] < 0) {
        children.splice(i$2, 3);
        i$2 -= 3;
      } }
      for (var i$3 = 0, j = 0; i$3 < built.children.length; i$3 += 3) {
        var from$1 = built.children[i$3];
        while (j < children.length && children[j] < from$1) { j += 3; }
        children.splice(j, 0, built.children[i$3], built.children[i$3 + 1], built.children[i$3 + 2]);
      }
    }
    return new DecorationSet(newLocal && newLocal.sort(byPos), children)
  }
  function moveSpans(spans, offset) {
    if (!offset || !spans.length) { return spans }
    var result = [];
    for (var i = 0; i < spans.length; i++) {
      var span = spans[i];
      result.push(new Decoration(span.from + offset, span.to + offset, span.type));
    }
    return result
  }
  function mapAndGatherRemainingDecorations(children, oldChildren, decorations, mapping, offset, oldOffset, options) {
    function gather(set, oldOffset) {
      for (var i = 0; i < set.local.length; i++) {
        var mapped = set.local[i].map(mapping, offset, oldOffset);
        if (mapped) { decorations.push(mapped); }
        else if (options.onRemove) { options.onRemove(set.local[i].spec); }
      }
      for (var i$1 = 0; i$1 < set.children.length; i$1 += 3)
        { gather(set.children[i$1 + 2], set.children[i$1] + oldOffset + 1); }
    }
    for (var i = 0; i < children.length; i += 3) { if (children[i + 1] == -1)
      { gather(children[i + 2], oldChildren[i] + oldOffset + 1); } }
    return decorations
  }
  function takeSpansForNode(spans, node, offset) {
    if (node.isLeaf) { return null }
    var end = offset + node.nodeSize, found = null;
    for (var i = 0, span = (void 0); i < spans.length; i++) {
      if ((span = spans[i]) && span.from > offset && span.to < end) {
  (found || (found = [])).push(span);
        spans[i] = null;
      }
    }
    return found
  }
  function withoutNulls(array) {
    var result = [];
    for (var i = 0; i < array.length; i++)
      { if (array[i] != null) { result.push(array[i]); } }
    return result
  }
  function buildTree(spans, node, offset, options) {
    var children = [], hasNulls = false;
    node.forEach(function (childNode, localStart) {
      var found = takeSpansForNode(spans, childNode, localStart + offset);
      if (found) {
        hasNulls = true;
        var subtree = buildTree(found, childNode, offset + localStart + 1, options);
        if (subtree != empty)
          { children.push(localStart, localStart + childNode.nodeSize, subtree); }
      }
    });
    var locals = moveSpans(hasNulls ? withoutNulls(spans) : spans, -offset).sort(byPos);
    for (var i = 0; i < locals.length; i++) { if (!locals[i].type.valid(node, locals[i])) {
      if (options.onRemove) { options.onRemove(locals[i].spec); }
      locals.splice(i--, 1);
    } }
    return locals.length || children.length ? new DecorationSet(locals, children) : empty
  }
  function byPos(a, b) {
    return a.from - b.from || a.to - b.to
  }
  function removeOverlap(spans) {
    var working = spans;
    for (var i = 0; i < working.length - 1; i++) {
      var span = working[i];
      if (span.from != span.to) { for (var j = i + 1; j < working.length; j++) {
        var next = working[j];
        if (next.from == span.from) {
          if (next.to != span.to) {
            if (working == spans) { working = spans.slice(); }
            working[j] = next.copy(next.from, span.to);
            insertAhead(working, j + 1, next.copy(span.to, next.to));
          }
          continue
        } else {
          if (next.from < span.to) {
            if (working == spans) { working = spans.slice(); }
            working[i] = span.copy(span.from, next.from);
            insertAhead(working, j, span.copy(next.from, span.to));
          }
          break
        }
      } }
    }
    return working
  }
  function insertAhead(array, i, deco) {
    while (i < array.length && byPos(deco, array[i]) > 0) { i++; }
    array.splice(i, 0, deco);
  }
  function viewDecorations(view) {
    var found = [];
    view.someProp("decorations", function (f) {
      var result = f(view.state);
      if (result && result != empty) { found.push(result); }
    });
    if (view.cursorWrapper)
      { found.push(DecorationSet.create(view.state.doc, [view.cursorWrapper.deco])); }
    return DecorationGroup.from(found)
  }
  var EditorView = function EditorView(place, props) {
    this._props = props;
    this.state = props.state;
    this.directPlugins = props.plugins || [];
    this.directPlugins.forEach(checkStateComponent);
    this.dispatch = this.dispatch.bind(this);
    this._root = null;
    this.focused = false;
    this.trackWrites = null;
    this.dom = (place && place.mount) || document.createElement("div");
    if (place) {
      if (place.appendChild) { place.appendChild(this.dom); }
      else if (place.apply) { place(this.dom); }
      else if (place.mount) { this.mounted = true; }
    }
    this.editable = getEditable(this);
    this.markCursor = null;
    this.cursorWrapper = null;
    updateCursorWrapper(this);
    this.nodeViews = buildNodeViews(this);
    this.docView = docViewDesc(this.state.doc, computeDocDeco(this), viewDecorations(this), this.dom, this);
    this.lastSelectedViewDesc = null;
    this.dragging = null;
    initInput(this);
    this.prevDirectPlugins = [];
    this.pluginViews = [];
    this.updatePluginViews();
  };
  var prototypeAccessors$2 = { props: { configurable: true },root: { configurable: true },isDestroyed: { configurable: true } };
  prototypeAccessors$2.props.get = function () {
    if (this._props.state != this.state) {
      var prev = this._props;
      this._props = {};
      for (var name in prev) { this._props[name] = prev[name]; }
      this._props.state = this.state;
    }
    return this._props
  };
  EditorView.prototype.update = function update (props) {
    if (props.handleDOMEvents != this._props.handleDOMEvents) { ensureListeners(this); }
    this._props = props;
    if (props.plugins) {
      props.plugins.forEach(checkStateComponent);
      this.directPlugins = props.plugins;
    }
    this.updateStateInner(props.state, true);
  };
  EditorView.prototype.setProps = function setProps (props) {
    var updated = {};
    for (var name in this._props) { updated[name] = this._props[name]; }
    updated.state = this.state;
    for (var name$1 in props) { updated[name$1] = props[name$1]; }
    this.update(updated);
  };
  EditorView.prototype.updateState = function updateState (state) {
    this.updateStateInner(state, this.state.plugins != state.plugins);
  };
  EditorView.prototype.updateStateInner = function updateStateInner (state, reconfigured) {
      var this$1$1 = this;
    var prev = this.state, redraw = false, updateSel = false;
    if (state.storedMarks && this.composing) {
      clearComposition(this);
      updateSel = true;
    }
    this.state = state;
    if (reconfigured) {
      var nodeViews = buildNodeViews(this);
      if (changedNodeViews(nodeViews, this.nodeViews)) {
        this.nodeViews = nodeViews;
        redraw = true;
      }
      ensureListeners(this);
    }
    this.editable = getEditable(this);
    updateCursorWrapper(this);
    var innerDeco = viewDecorations(this), outerDeco = computeDocDeco(this);
    var scroll = reconfigured ? "reset"
        : state.scrollToSelection > prev.scrollToSelection ? "to selection" : "preserve";
    var updateDoc = redraw || !this.docView.matchesNode(state.doc, outerDeco, innerDeco);
    if (updateDoc || !state.selection.eq(prev.selection)) { updateSel = true; }
    var oldScrollPos = scroll == "preserve" && updateSel && this.dom.style.overflowAnchor == null && storeScrollPos(this);
    if (updateSel) {
      this.domObserver.stop();
      var forceSelUpdate = updateDoc && (result.ie || result.chrome) && !this.composing &&
          !prev.selection.empty && !state.selection.empty && selectionContextChanged(prev.selection, state.selection);
      if (updateDoc) {
        var chromeKludge = result.chrome ? (this.trackWrites = this.root.getSelection().focusNode) : null;
        if (redraw || !this.docView.update(state.doc, outerDeco, innerDeco, this)) {
          this.docView.updateOuterDeco([]);
          this.docView.destroy();
          this.docView = docViewDesc(state.doc, outerDeco, innerDeco, this.dom, this);
        }
        if (chromeKludge && !this.trackWrites) { forceSelUpdate = true; }
      }
      if (forceSelUpdate ||
          !(this.mouseDown && this.domObserver.currentSelection.eq(this.root.getSelection()) && anchorInRightPlace(this))) {
        selectionToDOM(this, forceSelUpdate);
      } else {
        syncNodeSelection(this, state.selection);
        this.domObserver.setCurSelection();
      }
      this.domObserver.start();
    }
    this.updatePluginViews(prev);
    if (scroll == "reset") {
      this.dom.scrollTop = 0;
    } else if (scroll == "to selection") {
      var startDOM = this.root.getSelection().focusNode;
      if (this.someProp("handleScrollToSelection", function (f) { return f(this$1$1); }))
        ;
      else if (state.selection instanceof NodeSelection)
        { scrollRectIntoView(this, this.docView.domAfterPos(state.selection.from).getBoundingClientRect(), startDOM); }
      else
        { scrollRectIntoView(this, this.coordsAtPos(state.selection.head, 1), startDOM); }
    } else if (oldScrollPos) {
      resetScrollPos(oldScrollPos);
    }
  };
  EditorView.prototype.destroyPluginViews = function destroyPluginViews () {
    var view;
    while (view = this.pluginViews.pop()) { if (view.destroy) { view.destroy(); } }
  };
  EditorView.prototype.updatePluginViews = function updatePluginViews (prevState) {
    if (!prevState || prevState.plugins != this.state.plugins || this.directPlugins != this.prevDirectPlugins) {
      this.prevDirectPlugins = this.directPlugins;
      this.destroyPluginViews();
      for (var i = 0; i < this.directPlugins.length; i++) {
        var plugin = this.directPlugins[i];
        if (plugin.spec.view) { this.pluginViews.push(plugin.spec.view(this)); }
      }
      for (var i$1 = 0; i$1 < this.state.plugins.length; i$1++) {
        var plugin$1 = this.state.plugins[i$1];
        if (plugin$1.spec.view) { this.pluginViews.push(plugin$1.spec.view(this)); }
      }
    } else {
      for (var i$2 = 0; i$2 < this.pluginViews.length; i$2++) {
        var pluginView = this.pluginViews[i$2];
        if (pluginView.update) { pluginView.update(this, prevState); }
      }
    }
  };
  EditorView.prototype.someProp = function someProp (propName, f) {
    var prop = this._props && this._props[propName], value;
    if (prop != null && (value = f ? f(prop) : prop)) { return value }
    for (var i = 0; i < this.directPlugins.length; i++) {
      var prop$1 = this.directPlugins[i].props[propName];
      if (prop$1 != null && (value = f ? f(prop$1) : prop$1)) { return value }
    }
    var plugins = this.state.plugins;
    if (plugins) { for (var i$1 = 0; i$1 < plugins.length; i$1++) {
      var prop$2 = plugins[i$1].props[propName];
      if (prop$2 != null && (value = f ? f(prop$2) : prop$2)) { return value }
    } }
  };
  EditorView.prototype.hasFocus = function hasFocus () {
    return this.root.activeElement == this.dom
  };
  EditorView.prototype.focus = function focus () {
    this.domObserver.stop();
    if (this.editable) { focusPreventScroll(this.dom); }
    selectionToDOM(this);
    this.domObserver.start();
  };
  prototypeAccessors$2.root.get = function () {
    var cached = this._root;
    if (cached == null) { for (var search = this.dom.parentNode; search; search = search.parentNode) {
      if (search.nodeType == 9 || (search.nodeType == 11 && search.host)) {
        if (!search.getSelection) { Object.getPrototypeOf(search).getSelection = function () { return document.getSelection(); }; }
        return this._root = search
      }
    } }
    return cached || document
  };
  EditorView.prototype.posAtCoords = function posAtCoords$1 (coords) {
    return posAtCoords(this, coords)
  };
  EditorView.prototype.coordsAtPos = function coordsAtPos$1 (pos, side) {
      if ( side === void 0 ) side = 1;
    return coordsAtPos(this, pos, side)
  };
  EditorView.prototype.domAtPos = function domAtPos (pos, side) {
      if ( side === void 0 ) side = 0;
    return this.docView.domFromPos(pos, side)
  };
  EditorView.prototype.nodeDOM = function nodeDOM (pos) {
    var desc = this.docView.descAt(pos);
    return desc ? desc.nodeDOM : null
  };
  EditorView.prototype.posAtDOM = function posAtDOM (node, offset, bias) {
      if ( bias === void 0 ) bias = -1;
    var pos = this.docView.posFromDOM(node, offset, bias);
    if (pos == null) { throw new RangeError("DOM position not inside the editor") }
    return pos
  };
  EditorView.prototype.endOfTextblock = function endOfTextblock$1 (dir, state) {
    return endOfTextblock(this, state || this.state, dir)
  };
  EditorView.prototype.destroy = function destroy () {
    if (!this.docView) { return }
    destroyInput(this);
    this.destroyPluginViews();
    if (this.mounted) {
      this.docView.update(this.state.doc, [], viewDecorations(this), this);
      this.dom.textContent = "";
    } else if (this.dom.parentNode) {
      this.dom.parentNode.removeChild(this.dom);
    }
    this.docView.destroy();
    this.docView = null;
  };
  prototypeAccessors$2.isDestroyed.get = function () {
    return this.docView == null
  };
  EditorView.prototype.dispatchEvent = function dispatchEvent$1 (event) {
    return dispatchEvent(this, event)
  };
  EditorView.prototype.dispatch = function dispatch (tr) {
    var dispatchTransaction = this._props.dispatchTransaction;
    if (dispatchTransaction) { dispatchTransaction.call(this, tr); }
    else { this.updateState(this.state.apply(tr)); }
  };
  Object.defineProperties( EditorView.prototype, prototypeAccessors$2 );
  function computeDocDeco(view) {
    var attrs = Object.create(null);
    attrs.class = "ProseMirror";
    attrs.contenteditable = String(view.editable);
    attrs.translate = "no";
    view.someProp("attributes", function (value) {
      if (typeof value == "function") { value = value(view.state); }
      if (value) { for (var attr in value) {
        if (attr == "class")
          { attrs.class += " " + value[attr]; }
        if (attr == "style") {
          attrs.style = (attrs.style ? attrs.style + ";" : "") + value[attr];
        }
        else if (!attrs[attr] && attr != "contenteditable" && attr != "nodeName")
          { attrs[attr] = String(value[attr]); }
      } }
    });
    return [Decoration.node(0, view.state.doc.content.size, attrs)]
  }
  function updateCursorWrapper(view) {
    if (view.markCursor) {
      var dom = document.createElement("img");
      dom.className = "ProseMirror-separator";
      dom.setAttribute("mark-placeholder", "true");
      dom.setAttribute("alt", "");
      view.cursorWrapper = {dom: dom, deco: Decoration.widget(view.state.selection.head, dom, {raw: true, marks: view.markCursor})};
    } else {
      view.cursorWrapper = null;
    }
  }
  function getEditable(view) {
    return !view.someProp("editable", function (value) { return value(view.state) === false; })
  }
  function selectionContextChanged(sel1, sel2) {
    var depth = Math.min(sel1.$anchor.sharedDepth(sel1.head), sel2.$anchor.sharedDepth(sel2.head));
    return sel1.$anchor.start(depth) != sel2.$anchor.start(depth)
  }
  function buildNodeViews(view) {
    var result = {};
    view.someProp("nodeViews", function (obj) {
      for (var prop in obj) { if (!Object.prototype.hasOwnProperty.call(result, prop))
        { result[prop] = obj[prop]; } }
    });
    return result
  }
  function changedNodeViews(a, b) {
    var nA = 0, nB = 0;
    for (var prop in a) {
      if (a[prop] != b[prop]) { return true }
      nA++;
    }
    for (var _ in b) { nB++; }
    return nA != nB
  }
  function checkStateComponent(plugin) {
    if (plugin.spec.state || plugin.spec.filterTransaction || plugin.spec.appendTransaction)
      { throw new RangeError("Plugins passed directly to the view must not have a state component") }
  }

  var base = {
    8: "Backspace",
    9: "Tab",
    10: "Enter",
    12: "NumLock",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    44: "PrintScreen",
    45: "Insert",
    46: "Delete",
    59: ";",
    61: "=",
    91: "Meta",
    92: "Meta",
    106: "*",
    107: "+",
    108: ",",
    109: "-",
    110: ".",
    111: "/",
    144: "NumLock",
    145: "ScrollLock",
    160: "Shift",
    161: "Shift",
    162: "Control",
    163: "Control",
    164: "Alt",
    165: "Alt",
    173: "-",
    186: ";",
    187: "=",
    188: ",",
    189: "-",
    190: ".",
    191: "/",
    192: "`",
    219: "[",
    220: "\\",
    221: "]",
    222: "'",
    229: "q"
  };
  var shift = {
    48: ")",
    49: "!",
    50: "@",
    51: "#",
    52: "$",
    53: "%",
    54: "^",
    55: "&",
    56: "*",
    57: "(",
    59: ":",
    61: "+",
    173: "_",
    186: ":",
    187: "+",
    188: "<",
    189: "_",
    190: ">",
    191: "?",
    192: "~",
    219: "{",
    220: "|",
    221: "}",
    222: "\"",
    229: "Q"
  };
  var chrome = typeof navigator != "undefined" && /Chrome\/(\d+)/.exec(navigator.userAgent);
  var safari = typeof navigator != "undefined" && /Apple Computer/.test(navigator.vendor);
  var gecko = typeof navigator != "undefined" && /Gecko\/\d+/.test(navigator.userAgent);
  var mac$1 = typeof navigator != "undefined" && /Mac/.test(navigator.platform);
  var ie = typeof navigator != "undefined" && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);
  var brokenModifierNames = chrome && (mac$1 || +chrome[1] < 57) || gecko && mac$1;
  for (var i = 0; i < 10; i++) base[48 + i] = base[96 + i] = String(i);
  for (var i = 1; i <= 24; i++) base[i + 111] = "F" + i;
  for (var i = 65; i <= 90; i++) {
    base[i] = String.fromCharCode(i + 32);
    shift[i] = String.fromCharCode(i);
  }
  for (var code in base) if (!shift.hasOwnProperty(code)) shift[code] = base[code];
  function keyName(event) {
    var ignoreKey = brokenModifierNames && (event.ctrlKey || event.altKey || event.metaKey) ||
      (safari || ie) && event.shiftKey && event.key && event.key.length == 1;
    var name = (!ignoreKey && event.key) ||
      (event.shiftKey ? shift : base)[event.keyCode] ||
      event.key || "Unidentified";
    if (name == "Esc") name = "Escape";
    if (name == "Del") name = "Delete";
    if (name == "Left") name = "ArrowLeft";
    if (name == "Up") name = "ArrowUp";
    if (name == "Right") name = "ArrowRight";
    if (name == "Down") name = "ArrowDown";
    return name
  }

  var mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false;
  function normalizeKeyName$1(name) {
    var parts = name.split(/-(?!$)/), result = parts[parts.length - 1];
    if (result == "Space") { result = " "; }
    var alt, ctrl, shift, meta;
    for (var i = 0; i < parts.length - 1; i++) {
      var mod = parts[i];
      if (/^(cmd|meta|m)$/i.test(mod)) { meta = true; }
      else if (/^a(lt)?$/i.test(mod)) { alt = true; }
      else if (/^(c|ctrl|control)$/i.test(mod)) { ctrl = true; }
      else if (/^s(hift)?$/i.test(mod)) { shift = true; }
      else if (/^mod$/i.test(mod)) { if (mac) { meta = true; } else { ctrl = true; } }
      else { throw new Error("Unrecognized modifier name: " + mod) }
    }
    if (alt) { result = "Alt-" + result; }
    if (ctrl) { result = "Ctrl-" + result; }
    if (meta) { result = "Meta-" + result; }
    if (shift) { result = "Shift-" + result; }
    return result
  }
  function normalize(map) {
    var copy = Object.create(null);
    for (var prop in map) { copy[normalizeKeyName$1(prop)] = map[prop]; }
    return copy
  }
  function modifiers(name, event, shift) {
    if (event.altKey) { name = "Alt-" + name; }
    if (event.ctrlKey) { name = "Ctrl-" + name; }
    if (event.metaKey) { name = "Meta-" + name; }
    if (shift !== false && event.shiftKey) { name = "Shift-" + name; }
    return name
  }
  function keymap(bindings) {
    return new Plugin({props: {handleKeyDown: keydownHandler(bindings)}})
  }
  function keydownHandler(bindings) {
    var map = normalize(bindings);
    return function(view, event) {
      var name = keyName(event), isChar = name.length == 1 && name != " ", baseName;
      var direct = map[modifiers(name, event, !isChar)];
      if (direct && direct(view.state, view.dispatch, view)) { return true }
      if (isChar && (event.shiftKey || event.altKey || event.metaKey || name.charCodeAt(0) > 127) &&
          (baseName = base[event.keyCode]) && baseName != name) {
        var fromCode = map[modifiers(baseName, event, true)];
        if (fromCode && fromCode(view.state, view.dispatch, view)) { return true }
      } else if (isChar && event.shiftKey) {
        var withShift = map[modifiers(name, event, true)];
        if (withShift && withShift(view.state, view.dispatch, view)) { return true }
      }
      return false
    }
  }

  function getType(value) {
      return Object.prototype.toString.call(value).slice(8, -1);
  }
  function isPlainObject(value) {
      if (getType(value) !== 'Object') {
          return false;
      }
      return value.constructor === Object && Object.getPrototypeOf(value) === Object.prototype;
  }
  function mergeDeep(target, source) {
      const output = { ...target };
      if (isPlainObject(target) && isPlainObject(source)) {
          Object.keys(source).forEach(key => {
              if (isPlainObject(source[key])) {
                  if (!(key in target)) {
                      Object.assign(output, { [key]: source[key] });
                  }
                  else {
                      output[key] = mergeDeep(target[key], source[key]);
                  }
              }
              else {
                  Object.assign(output, { [key]: source[key] });
              }
          });
      }
      return output;
  }
  function isFunction(value) {
      return typeof value === 'function';
  }
  function callOrReturn(value, context = undefined, ...props) {
      if (isFunction(value)) {
          if (context) {
              return value.bind(context)(...props);
          }
          return value(...props);
      }
      return value;
  }
  function getExtensionField(extension, field, context) {
      if (extension.config[field] === undefined && extension.parent) {
          return getExtensionField(extension.parent, field, context);
      }
      if (typeof extension.config[field] === 'function') {
          const value = extension.config[field].bind({
              ...context,
              parent: extension.parent
                  ? getExtensionField(extension.parent, field, context)
                  : null,
          });
          return value;
      }
      return extension.config[field];
  }
  class Extension {
      constructor(config = {}) {
          this.type = 'extension';
          this.name = 'extension';
          this.parent = null;
          this.child = null;
          this.config = {
              name: this.name,
              defaultOptions: {},
          };
          this.config = {
              ...this.config,
              ...config,
          };
          this.name = this.config.name;
          if (config.defaultOptions) {
              console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`);
          }
          this.options = this.config.defaultOptions;
          if (this.config.addOptions) {
              this.options = callOrReturn(getExtensionField(this, 'addOptions', {
                  name: this.name,
              }));
          }
          this.storage = callOrReturn(getExtensionField(this, 'addStorage', {
              name: this.name,
              options: this.options,
          })) || {};
      }
      static create(config = {}) {
          return new Extension(config);
      }
      configure(options = {}) {
          const extension = this.extend();
          extension.options = mergeDeep(this.options, options);
          extension.storage = callOrReturn(getExtensionField(extension, 'addStorage', {
              name: extension.name,
              options: extension.options,
          }));
          return extension;
      }
      extend(extendedConfig = {}) {
          const extension = new Extension(extendedConfig);
          extension.parent = this;
          this.child = extension;
          extension.name = extendedConfig.name
              ? extendedConfig.name
              : extension.parent.name;
          if (extendedConfig.defaultOptions) {
              console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${extension.name}".`);
          }
          extension.options = callOrReturn(getExtensionField(extension, 'addOptions', {
              name: extension.name,
          }));
          extension.storage = callOrReturn(getExtensionField(extension, 'addStorage', {
              name: extension.name,
              options: extension.options,
          }));
          return extension;
      }
  }
  function getTextBetween(startNode, range, options) {
      const { from, to } = range;
      const { blockSeparator = '\n\n', textSerializers = {}, } = options || {};
      let text = '';
      let separated = true;
      startNode.nodesBetween(from, to, (node, pos, parent, index) => {
          var _a;
          const textSerializer = textSerializers === null || textSerializers === void 0 ? void 0 : textSerializers[node.type.name];
          if (textSerializer) {
              if (node.isBlock && !separated) {
                  text += blockSeparator;
                  separated = true;
              }
              text += textSerializer({
                  node,
                  pos,
                  parent,
                  index,
              });
          }
          else if (node.isText) {
              text += (_a = node === null || node === void 0 ? void 0 : node.text) === null || _a === void 0 ? void 0 : _a.slice(Math.max(from, pos) - pos, to - pos);
              separated = false;
          }
          else if (node.isBlock && !separated) {
              text += blockSeparator;
              separated = true;
          }
      });
      return text;
  }
  function getTextSeralizersFromSchema(schema) {
      return Object.fromEntries(Object
          .entries(schema.nodes)
          .filter(([, node]) => node.spec.toText)
          .map(([name, node]) => [name, node.spec.toText]));
  }
  const ClipboardTextSerializer = Extension.create({
      name: 'clipboardTextSerializer',
      addProseMirrorPlugins() {
          return [
              new Plugin({
                  key: new PluginKey('clipboardTextSerializer'),
                  props: {
                      clipboardTextSerializer: () => {
                          const { editor } = this;
                          const { state, schema } = editor;
                          const { doc, selection } = state;
                          const { ranges } = selection;
                          const from = Math.min(...ranges.map(range => range.$from.pos));
                          const to = Math.max(...ranges.map(range => range.$to.pos));
                          const textSerializers = getTextSeralizersFromSchema(schema);
                          const range = { from, to };
                          return getTextBetween(doc, range, {
                              textSerializers,
                          });
                      },
                  },
              }),
          ];
      },
  });
  const blur = () => ({ editor, view }) => {
      requestAnimationFrame(() => {
          var _a;
          if (!editor.isDestroyed) {
              view.dom.blur();
              (_a = window === null || window === void 0 ? void 0 : window.getSelection()) === null || _a === void 0 ? void 0 : _a.removeAllRanges();
          }
      });
      return true;
  };
  var blur$1 = Object.freeze({
    __proto__: null,
    blur: blur
  });
  const clearContent = (emitUpdate = false) => ({ commands }) => {
      return commands.setContent('', emitUpdate);
  };
  var clearContent$1 = Object.freeze({
    __proto__: null,
    clearContent: clearContent
  });
  const clearNodes = () => ({ state, tr, dispatch }) => {
      const { selection } = tr;
      const { ranges } = selection;
      if (!dispatch) {
          return true;
      }
      ranges.forEach(({ $from, $to }) => {
          state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
              if (node.type.isText) {
                  return;
              }
              const { doc, mapping } = tr;
              const $mappedFrom = doc.resolve(mapping.map(pos));
              const $mappedTo = doc.resolve(mapping.map(pos + node.nodeSize));
              const nodeRange = $mappedFrom.blockRange($mappedTo);
              if (!nodeRange) {
                  return;
              }
              const targetLiftDepth = liftTarget(nodeRange);
              if (node.type.isTextblock) {
                  const { defaultType } = $mappedFrom.parent.contentMatchAt($mappedFrom.index());
                  tr.setNodeMarkup(nodeRange.start, defaultType);
              }
              if (targetLiftDepth || targetLiftDepth === 0) {
                  tr.lift(nodeRange, targetLiftDepth);
              }
          });
      });
      return true;
  };
  var clearNodes$1 = Object.freeze({
    __proto__: null,
    clearNodes: clearNodes
  });
  const command = fn => props => {
      return fn(props);
  };
  var command$1 = Object.freeze({
    __proto__: null,
    command: command
  });
  const createParagraphNear = () => ({ state, dispatch }) => {
      return createParagraphNear$2(state, dispatch);
  };
  var createParagraphNear$1 = Object.freeze({
    __proto__: null,
    createParagraphNear: createParagraphNear
  });
  function getNodeType(nameOrType, schema) {
      if (typeof nameOrType === 'string') {
          if (!schema.nodes[nameOrType]) {
              throw Error(`There is no node type named '${nameOrType}'. Maybe you forgot to add the extension?`);
          }
          return schema.nodes[nameOrType];
      }
      return nameOrType;
  }
  const deleteNode = typeOrName => ({ tr, state, dispatch }) => {
      const type = getNodeType(typeOrName, state.schema);
      const $pos = tr.selection.$anchor;
      for (let depth = $pos.depth; depth > 0; depth -= 1) {
          const node = $pos.node(depth);
          if (node.type === type) {
              if (dispatch) {
                  const from = $pos.before(depth);
                  const to = $pos.after(depth);
                  tr.delete(from, to).scrollIntoView();
              }
              return true;
          }
      }
      return false;
  };
  var deleteNode$1 = Object.freeze({
    __proto__: null,
    deleteNode: deleteNode
  });
  const deleteRange = range => ({ tr, dispatch }) => {
      const { from, to } = range;
      if (dispatch) {
          tr.delete(from, to);
      }
      return true;
  };
  var deleteRange$1 = Object.freeze({
    __proto__: null,
    deleteRange: deleteRange
  });
  const deleteSelection = () => ({ state, dispatch }) => {
      return deleteSelection$2(state, dispatch);
  };
  var deleteSelection$1 = Object.freeze({
    __proto__: null,
    deleteSelection: deleteSelection
  });
  const enter = () => ({ commands }) => {
      return commands.keyboardShortcut('Enter');
  };
  var enter$1 = Object.freeze({
    __proto__: null,
    enter: enter
  });
  const exitCode = () => ({ state, dispatch }) => {
      return exitCode$2(state, dispatch);
  };
  var exitCode$1 = Object.freeze({
    __proto__: null,
    exitCode: exitCode
  });
  function getMarkType(nameOrType, schema) {
      if (typeof nameOrType === 'string') {
          if (!schema.marks[nameOrType]) {
              throw Error(`There is no mark type named '${nameOrType}'. Maybe you forgot to add the extension?`);
          }
          return schema.marks[nameOrType];
      }
      return nameOrType;
  }
  function isRegExp(value) {
      return Object.prototype.toString.call(value) === '[object RegExp]';
  }
  function objectIncludes(object1, object2, options = { strict: true }) {
      const keys = Object.keys(object2);
      if (!keys.length) {
          return true;
      }
      return keys.every(key => {
          if (options.strict) {
              return object2[key] === object1[key];
          }
          if (isRegExp(object2[key])) {
              return object2[key].test(object1[key]);
          }
          return object2[key] === object1[key];
      });
  }
  function findMarkInSet(marks, type, attributes = {}) {
      return marks.find(item => {
          return item.type === type && objectIncludes(item.attrs, attributes);
      });
  }
  function isMarkInSet(marks, type, attributes = {}) {
      return !!findMarkInSet(marks, type, attributes);
  }
  function getMarkRange($pos, type, attributes = {}) {
      if (!$pos || !type) {
          return;
      }
      const start = $pos.parent.childAfter($pos.parentOffset);
      if (!start.node) {
          return;
      }
      const mark = findMarkInSet(start.node.marks, type, attributes);
      if (!mark) {
          return;
      }
      let startIndex = $pos.index();
      let startPos = $pos.start() + start.offset;
      let endIndex = startIndex + 1;
      let endPos = startPos + start.node.nodeSize;
      findMarkInSet(start.node.marks, type, attributes);
      while (startIndex > 0 && mark.isInSet($pos.parent.child(startIndex - 1).marks)) {
          startIndex -= 1;
          startPos -= $pos.parent.child(startIndex).nodeSize;
      }
      while (endIndex < $pos.parent.childCount
          && isMarkInSet($pos.parent.child(endIndex).marks, type, attributes)) {
          endPos += $pos.parent.child(endIndex).nodeSize;
          endIndex += 1;
      }
      return {
          from: startPos,
          to: endPos,
      };
  }
  const extendMarkRange = (typeOrName, attributes = {}) => ({ tr, state, dispatch }) => {
      const type = getMarkType(typeOrName, state.schema);
      const { doc, selection } = tr;
      const { $from, from, to } = selection;
      if (dispatch) {
          const range = getMarkRange($from, type, attributes);
          if (range && range.from <= from && range.to >= to) {
              const newSelection = TextSelection.create(doc, range.from, range.to);
              tr.setSelection(newSelection);
          }
      }
      return true;
  };
  var extendMarkRange$1 = Object.freeze({
    __proto__: null,
    extendMarkRange: extendMarkRange
  });
  const first = commands => props => {
      const items = typeof commands === 'function'
          ? commands(props)
          : commands;
      for (let i = 0; i < items.length; i += 1) {
          if (items[i](props)) {
              return true;
          }
      }
      return false;
  };
  var first$1 = Object.freeze({
    __proto__: null,
    first: first
  });
  function isClass(value) {
      var _a;
      if (((_a = value.constructor) === null || _a === void 0 ? void 0 : _a.toString().substring(0, 5)) !== 'class') {
          return false;
      }
      return true;
  }
  function isObject(value) {
      return (value
          && typeof value === 'object'
          && !Array.isArray(value)
          && !isClass(value));
  }
  function isTextSelection(value) {
      return isObject(value) && value instanceof TextSelection;
  }
  function isiOS() {
      return [
          'iPad Simulator',
          'iPhone Simulator',
          'iPod Simulator',
          'iPad',
          'iPhone',
          'iPod',
      ].includes(navigator.platform)
          || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
  }
  function minMax(value = 0, min = 0, max = 0) {
      return Math.min(Math.max(value, min), max);
  }
  function resolveFocusPosition(doc, position = null) {
      if (!position) {
          return null;
      }
      const selectionAtStart = Selection.atStart(doc);
      const selectionAtEnd = Selection.atEnd(doc);
      if (position === 'start' || position === true) {
          return selectionAtStart;
      }
      if (position === 'end') {
          return selectionAtEnd;
      }
      const minPos = selectionAtStart.from;
      const maxPos = selectionAtEnd.to;
      if (position === 'all') {
          return TextSelection.create(doc, minMax(0, minPos, maxPos), minMax(doc.content.size, minPos, maxPos));
      }
      return TextSelection.create(doc, minMax(position, minPos, maxPos), minMax(position, minPos, maxPos));
  }
  const focus = (position = null, options) => ({ editor, view, tr, dispatch, }) => {
      options = {
          scrollIntoView: true,
          ...options,
      };
      const delayedFocus = () => {
          if (isiOS()) {
              view.dom.focus();
          }
          requestAnimationFrame(() => {
              if (!editor.isDestroyed) {
                  view.focus();
                  if (options === null || options === void 0 ? void 0 : options.scrollIntoView) {
                      editor.commands.scrollIntoView();
                  }
              }
          });
      };
      if ((view.hasFocus() && position === null) || position === false) {
          return true;
      }
      if (dispatch && position === null && !isTextSelection(editor.state.selection)) {
          delayedFocus();
          return true;
      }
      const selection = resolveFocusPosition(editor.state.doc, position) || editor.state.selection;
      const isSameSelection = editor.state.selection.eq(selection);
      if (dispatch) {
          if (!isSameSelection) {
              tr.setSelection(selection);
          }
          if (isSameSelection && tr.storedMarks) {
              tr.setStoredMarks(tr.storedMarks);
          }
          delayedFocus();
      }
      return true;
  };
  var focus$1 = Object.freeze({
    __proto__: null,
    focus: focus
  });
  const forEach = (items, fn) => props => {
      return items.every((item, index) => fn(item, { ...props, index }));
  };
  var forEach$1 = Object.freeze({
    __proto__: null,
    forEach: forEach
  });
  const insertContent = (value, options) => ({ tr, commands }) => {
      return commands.insertContentAt({ from: tr.selection.from, to: tr.selection.to }, value, options);
  };
  var insertContent$1 = Object.freeze({
    __proto__: null,
    insertContent: insertContent
  });
  function elementFromString(value) {
      const wrappedValue = `<body>${value}</body>`;
      return new window.DOMParser().parseFromString(wrappedValue, 'text/html').body;
  }
  function createNodeFromContent(content, schema, options) {
      options = {
          slice: true,
          parseOptions: {},
          ...options,
      };
      if (typeof content === 'object' && content !== null) {
          try {
              if (Array.isArray(content)) {
                  return Fragment.fromArray(content.map(item => schema.nodeFromJSON(item)));
              }
              return schema.nodeFromJSON(content);
          }
          catch (error) {
              console.warn('[tiptap warn]: Invalid content.', 'Passed value:', content, 'Error:', error);
              return createNodeFromContent('', schema, options);
          }
      }
      if (typeof content === 'string') {
          const parser = DOMParser.fromSchema(schema);
          return options.slice
              ? parser.parseSlice(elementFromString(content), options.parseOptions).content
              : parser.parse(elementFromString(content), options.parseOptions);
      }
      return createNodeFromContent('', schema, options);
  }
  function selectionToInsertionEnd(tr, startLen, bias) {
      const last = tr.steps.length - 1;
      if (last < startLen) {
          return;
      }
      const step = tr.steps[last];
      if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep)) {
          return;
      }
      const map = tr.mapping.maps[last];
      let end = 0;
      map.forEach((_from, _to, _newFrom, newTo) => {
          if (end === 0) {
              end = newTo;
          }
      });
      tr.setSelection(Selection.near(tr.doc.resolve(end), bias));
  }
  const isFragment = (nodeOrFragment) => {
      return nodeOrFragment.toString().startsWith('<');
  };
  const insertContentAt = (position, value, options) => ({ tr, dispatch, editor }) => {
      if (dispatch) {
          options = {
              parseOptions: {},
              updateSelection: true,
              ...options,
          };
          const content = createNodeFromContent(value, editor.schema, {
              parseOptions: {
                  preserveWhitespace: 'full',
                  ...options.parseOptions,
              },
          });
          if (content.toString() === '<>') {
              return true;
          }
          let { from, to } = typeof position === 'number'
              ? { from: position, to: position }
              : position;
          let isOnlyTextContent = true;
          let isOnlyBlockContent = true;
          const nodes = isFragment(content)
              ? content
              : [content];
          nodes.forEach(node => {
              node.check();
              isOnlyTextContent = isOnlyTextContent
                  ? node.isText && node.marks.length === 0
                  : false;
              isOnlyBlockContent = isOnlyBlockContent
                  ? node.isBlock
                  : false;
          });
          if (from === to && isOnlyBlockContent) {
              const { parent } = tr.doc.resolve(from);
              const isEmptyTextBlock = parent.isTextblock
                  && !parent.type.spec.code
                  && !parent.childCount;
              if (isEmptyTextBlock) {
                  from -= 1;
                  to += 1;
              }
          }
          if (isOnlyTextContent) {
              tr.insertText(value, from, to);
          }
          else {
              tr.replaceWith(from, to, content);
          }
          if (options.updateSelection) {
              selectionToInsertionEnd(tr, tr.steps.length - 1, -1);
          }
      }
      return true;
  };
  var insertContentAt$1 = Object.freeze({
    __proto__: null,
    insertContentAt: insertContentAt
  });
  const joinBackward = () => ({ state, dispatch }) => {
      return joinBackward$2(state, dispatch);
  };
  var joinBackward$1 = Object.freeze({
    __proto__: null,
    joinBackward: joinBackward
  });
  const joinForward = () => ({ state, dispatch }) => {
      return joinForward$2(state, dispatch);
  };
  var joinForward$1 = Object.freeze({
    __proto__: null,
    joinForward: joinForward
  });
  function isMacOS() {
      return typeof navigator !== 'undefined'
          ? /Mac/.test(navigator.platform)
          : false;
  }
  function normalizeKeyName(name) {
      const parts = name.split(/-(?!$)/);
      let result = parts[parts.length - 1];
      if (result === 'Space') {
          result = ' ';
      }
      let alt;
      let ctrl;
      let shift;
      let meta;
      for (let i = 0; i < parts.length - 1; i += 1) {
          const mod = parts[i];
          if (/^(cmd|meta|m)$/i.test(mod)) {
              meta = true;
          }
          else if (/^a(lt)?$/i.test(mod)) {
              alt = true;
          }
          else if (/^(c|ctrl|control)$/i.test(mod)) {
              ctrl = true;
          }
          else if (/^s(hift)?$/i.test(mod)) {
              shift = true;
          }
          else if (/^mod$/i.test(mod)) {
              if (isiOS() || isMacOS()) {
                  meta = true;
              }
              else {
                  ctrl = true;
              }
          }
          else {
              throw new Error(`Unrecognized modifier name: ${mod}`);
          }
      }
      if (alt) {
          result = `Alt-${result}`;
      }
      if (ctrl) {
          result = `Ctrl-${result}`;
      }
      if (meta) {
          result = `Meta-${result}`;
      }
      if (shift) {
          result = `Shift-${result}`;
      }
      return result;
  }
  const keyboardShortcut = name => ({ editor, view, tr, dispatch, }) => {
      const keys = normalizeKeyName(name).split(/-(?!$)/);
      const key = keys.find(item => !['Alt', 'Ctrl', 'Meta', 'Shift'].includes(item));
      const event = new KeyboardEvent('keydown', {
          key: key === 'Space'
              ? ' '
              : key,
          altKey: keys.includes('Alt'),
          ctrlKey: keys.includes('Ctrl'),
          metaKey: keys.includes('Meta'),
          shiftKey: keys.includes('Shift'),
          bubbles: true,
          cancelable: true,
      });
      const capturedTransaction = editor.captureTransaction(() => {
          view.someProp('handleKeyDown', f => f(view, event));
      });
      capturedTransaction === null || capturedTransaction === void 0 ? void 0 : capturedTransaction.steps.forEach(step => {
          const newStep = step.map(tr.mapping);
          if (newStep && dispatch) {
              tr.maybeStep(newStep);
          }
      });
      return true;
  };
  var keyboardShortcut$1 = Object.freeze({
    __proto__: null,
    keyboardShortcut: keyboardShortcut
  });
  function isNodeActive(state, typeOrName, attributes = {}) {
      const { from, to, empty } = state.selection;
      const type = typeOrName
          ? getNodeType(typeOrName, state.schema)
          : null;
      const nodeRanges = [];
      state.doc.nodesBetween(from, to, (node, pos) => {
          if (node.isText) {
              return;
          }
          const relativeFrom = Math.max(from, pos);
          const relativeTo = Math.min(to, pos + node.nodeSize);
          nodeRanges.push({
              node,
              from: relativeFrom,
              to: relativeTo,
          });
      });
      const selectionRange = to - from;
      const matchedNodeRanges = nodeRanges
          .filter(nodeRange => {
          if (!type) {
              return true;
          }
          return type.name === nodeRange.node.type.name;
      })
          .filter(nodeRange => objectIncludes(nodeRange.node.attrs, attributes, { strict: false }));
      if (empty) {
          return !!matchedNodeRanges.length;
      }
      const range = matchedNodeRanges
          .reduce((sum, nodeRange) => sum + nodeRange.to - nodeRange.from, 0);
      return range >= selectionRange;
  }
  const lift = (typeOrName, attributes = {}) => ({ state, dispatch }) => {
      const type = getNodeType(typeOrName, state.schema);
      const isActive = isNodeActive(state, type, attributes);
      if (!isActive) {
          return false;
      }
      return lift$2(state, dispatch);
  };
  var lift$1 = Object.freeze({
    __proto__: null,
    lift: lift
  });
  const liftEmptyBlock = () => ({ state, dispatch }) => {
      return liftEmptyBlock$2(state, dispatch);
  };
  var liftEmptyBlock$1 = Object.freeze({
    __proto__: null,
    liftEmptyBlock: liftEmptyBlock
  });
  const liftListItem = typeOrName => ({ state, dispatch }) => {
      const type = getNodeType(typeOrName, state.schema);
      return liftListItem$2(type)(state, dispatch);
  };
  var liftListItem$1 = Object.freeze({
    __proto__: null,
    liftListItem: liftListItem
  });
  const newlineInCode = () => ({ state, dispatch }) => {
      return newlineInCode$2(state, dispatch);
  };
  var newlineInCode$1 = Object.freeze({
    __proto__: null,
    newlineInCode: newlineInCode
  });
  function getSchemaTypeNameByName(name, schema) {
      if (schema.nodes[name]) {
          return 'node';
      }
      if (schema.marks[name]) {
          return 'mark';
      }
      return null;
  }
  function deleteProps(obj, propOrProps) {
      const props = typeof propOrProps === 'string'
          ? [propOrProps]
          : propOrProps;
      return Object
          .keys(obj)
          .reduce((newObj, prop) => {
          if (!props.includes(prop)) {
              newObj[prop] = obj[prop];
          }
          return newObj;
      }, {});
  }
  const resetAttributes = (typeOrName, attributes) => ({ tr, state, dispatch }) => {
      let nodeType = null;
      let markType = null;
      const schemaType = getSchemaTypeNameByName(typeof typeOrName === 'string'
          ? typeOrName
          : typeOrName.name, state.schema);
      if (!schemaType) {
          return false;
      }
      if (schemaType === 'node') {
          nodeType = getNodeType(typeOrName, state.schema);
      }
      if (schemaType === 'mark') {
          markType = getMarkType(typeOrName, state.schema);
      }
      if (dispatch) {
          tr.selection.ranges.forEach(range => {
              state.doc.nodesBetween(range.$from.pos, range.$to.pos, (node, pos) => {
                  if (nodeType && nodeType === node.type) {
                      tr.setNodeMarkup(pos, undefined, deleteProps(node.attrs, attributes));
                  }
                  if (markType && node.marks.length) {
                      node.marks.forEach(mark => {
                          if (markType === mark.type) {
                              tr.addMark(pos, pos + node.nodeSize, markType.create(deleteProps(mark.attrs, attributes)));
                          }
                      });
                  }
              });
          });
      }
      return true;
  };
  var resetAttributes$1 = Object.freeze({
    __proto__: null,
    resetAttributes: resetAttributes
  });
  const scrollIntoView = () => ({ tr, dispatch }) => {
      if (dispatch) {
          tr.scrollIntoView();
      }
      return true;
  };
  var scrollIntoView$1 = Object.freeze({
    __proto__: null,
    scrollIntoView: scrollIntoView
  });
  const selectAll = () => ({ tr, commands }) => {
      return commands.setTextSelection({
          from: 0,
          to: tr.doc.content.size,
      });
  };
  var selectAll$1 = Object.freeze({
    __proto__: null,
    selectAll: selectAll
  });
  const selectNodeBackward = () => ({ state, dispatch }) => {
      return selectNodeBackward$2(state, dispatch);
  };
  var selectNodeBackward$1 = Object.freeze({
    __proto__: null,
    selectNodeBackward: selectNodeBackward
  });
  const selectNodeForward = () => ({ state, dispatch }) => {
      return selectNodeForward$2(state, dispatch);
  };
  var selectNodeForward$1 = Object.freeze({
    __proto__: null,
    selectNodeForward: selectNodeForward
  });
  const selectParentNode = () => ({ state, dispatch }) => {
      return selectParentNode$2(state, dispatch);
  };
  var selectParentNode$1 = Object.freeze({
    __proto__: null,
    selectParentNode: selectParentNode
  });
  const selectTextblockEnd = () => ({ state, dispatch }) => {
      return selectTextblockEnd$2(state, dispatch);
  };
  var selectTextblockEnd$1 = Object.freeze({
    __proto__: null,
    selectTextblockEnd: selectTextblockEnd
  });
  const selectTextblockStart = () => ({ state, dispatch }) => {
      return selectTextblockStart$2(state, dispatch);
  };
  var selectTextblockStart$1 = Object.freeze({
    __proto__: null,
    selectTextblockStart: selectTextblockStart
  });
  function createDocument(content, schema, parseOptions = {}) {
      return createNodeFromContent(content, schema, { slice: false, parseOptions });
  }
  const setContent = (content, emitUpdate = false, parseOptions = {}) => ({ tr, editor, dispatch }) => {
      const { doc } = tr;
      const document = createDocument(content, editor.schema, parseOptions);
      const selection = TextSelection.create(doc, 0, doc.content.size);
      if (dispatch) {
          tr.setSelection(selection)
              .replaceSelectionWith(document, false)
              .setMeta('preventUpdate', !emitUpdate);
      }
      return true;
  };
  var setContent$1 = Object.freeze({
    __proto__: null,
    setContent: setContent
  });
  function getMarkAttributes(state, typeOrName) {
      const type = getMarkType(typeOrName, state.schema);
      const { from, to, empty } = state.selection;
      const marks = [];
      if (empty) {
          if (state.storedMarks) {
              marks.push(...state.storedMarks);
          }
          marks.push(...state.selection.$head.marks());
      }
      else {
          state.doc.nodesBetween(from, to, node => {
              marks.push(...node.marks);
          });
      }
      const mark = marks.find(markItem => markItem.type.name === type.name);
      if (!mark) {
          return {};
      }
      return { ...mark.attrs };
  }
  const setMark = (typeOrName, attributes = {}) => ({ tr, state, dispatch }) => {
      const { selection } = tr;
      const { empty, ranges } = selection;
      const type = getMarkType(typeOrName, state.schema);
      if (dispatch) {
          if (empty) {
              const oldAttributes = getMarkAttributes(state, type);
              tr.addStoredMark(type.create({
                  ...oldAttributes,
                  ...attributes,
              }));
          }
          else {
              ranges.forEach(range => {
                  const from = range.$from.pos;
                  const to = range.$to.pos;
                  state.doc.nodesBetween(from, to, (node, pos) => {
                      const trimmedFrom = Math.max(pos, from);
                      const trimmedTo = Math.min(pos + node.nodeSize, to);
                      const someHasMark = node.marks.find(mark => mark.type === type);
                      if (someHasMark) {
                          node.marks.forEach(mark => {
                              if (type === mark.type) {
                                  tr.addMark(trimmedFrom, trimmedTo, type.create({
                                      ...mark.attrs,
                                      ...attributes,
                                  }));
                              }
                          });
                      }
                      else {
                          tr.addMark(trimmedFrom, trimmedTo, type.create(attributes));
                      }
                  });
              });
          }
      }
      return true;
  };
  var setMark$1 = Object.freeze({
    __proto__: null,
    setMark: setMark
  });
  const setMeta = (key, value) => ({ tr }) => {
      tr.setMeta(key, value);
      return true;
  };
  var setMeta$1 = Object.freeze({
    __proto__: null,
    setMeta: setMeta
  });
  const setNode = (typeOrName, attributes = {}) => ({ state, dispatch, chain }) => {
      const type = getNodeType(typeOrName, state.schema);
      if (!type.isTextblock) {
          console.warn('[tiptap warn]: Currently "setNode()" only supports text block nodes.');
          return false;
      }
      return chain()
          .command(({ commands }) => {
          const canSetBlock = setBlockType(type, attributes)(state);
          if (canSetBlock) {
              return true;
          }
          return commands.clearNodes();
      })
          .command(({ state: updatedState }) => {
          return setBlockType(type, attributes)(updatedState, dispatch);
      })
          .run();
  };
  var setNode$1 = Object.freeze({
    __proto__: null,
    setNode: setNode
  });
  const setNodeSelection = position => ({ tr, dispatch }) => {
      if (dispatch) {
          const { doc } = tr;
          const minPos = Selection.atStart(doc).from;
          const maxPos = Selection.atEnd(doc).to;
          const resolvedPos = minMax(position, minPos, maxPos);
          const selection = NodeSelection.create(doc, resolvedPos);
          tr.setSelection(selection);
      }
      return true;
  };
  var setNodeSelection$1 = Object.freeze({
    __proto__: null,
    setNodeSelection: setNodeSelection
  });
  const setTextSelection = position => ({ tr, dispatch }) => {
      if (dispatch) {
          const { doc } = tr;
          const { from, to } = typeof position === 'number'
              ? { from: position, to: position }
              : position;
          const minPos = TextSelection.atStart(doc).from;
          const maxPos = TextSelection.atEnd(doc).to;
          const resolvedFrom = minMax(from, minPos, maxPos);
          const resolvedEnd = minMax(to, minPos, maxPos);
          const selection = TextSelection.create(doc, resolvedFrom, resolvedEnd);
          tr.setSelection(selection);
      }
      return true;
  };
  var setTextSelection$1 = Object.freeze({
    __proto__: null,
    setTextSelection: setTextSelection
  });
  const sinkListItem = typeOrName => ({ state, dispatch }) => {
      const type = getNodeType(typeOrName, state.schema);
      return sinkListItem$2(type)(state, dispatch);
  };
  var sinkListItem$1 = Object.freeze({
    __proto__: null,
    sinkListItem: sinkListItem
  });
  function getSplittedAttributes(extensionAttributes, typeName, attributes) {
      return Object.fromEntries(Object
          .entries(attributes)
          .filter(([name]) => {
          const extensionAttribute = extensionAttributes.find(item => {
              return item.type === typeName && item.name === name;
          });
          if (!extensionAttribute) {
              return false;
          }
          return extensionAttribute.attribute.keepOnSplit;
      }));
  }
  function defaultBlockAt$1(match) {
      for (let i = 0; i < match.edgeCount; i += 1) {
          const { type } = match.edge(i);
          if (type.isTextblock && !type.hasRequiredAttrs()) {
              return type;
          }
      }
      return null;
  }
  function ensureMarks(state, splittableMarks) {
      const marks = state.storedMarks
          || (state.selection.$to.parentOffset && state.selection.$from.marks());
      if (marks) {
          const filteredMarks = marks.filter(mark => splittableMarks === null || splittableMarks === void 0 ? void 0 : splittableMarks.includes(mark.type.name));
          state.tr.ensureMarks(filteredMarks);
      }
  }
  const splitBlock = ({ keepMarks = true } = {}) => ({ tr, state, dispatch, editor, }) => {
      const { selection, doc } = tr;
      const { $from, $to } = selection;
      const extensionAttributes = editor.extensionManager.attributes;
      const newAttributes = getSplittedAttributes(extensionAttributes, $from.node().type.name, $from.node().attrs);
      if (selection instanceof NodeSelection && selection.node.isBlock) {
          if (!$from.parentOffset || !canSplit(doc, $from.pos)) {
              return false;
          }
          if (dispatch) {
              if (keepMarks) {
                  ensureMarks(state, editor.extensionManager.splittableMarks);
              }
              tr.split($from.pos).scrollIntoView();
          }
          return true;
      }
      if (!$from.parent.isBlock) {
          return false;
      }
      if (dispatch) {
          const atEnd = $to.parentOffset === $to.parent.content.size;
          if (selection instanceof TextSelection) {
              tr.deleteSelection();
          }
          const deflt = $from.depth === 0
              ? undefined
              : defaultBlockAt$1($from.node(-1).contentMatchAt($from.indexAfter(-1)));
          let types = atEnd && deflt
              ? [{
                      type: deflt,
                      attrs: newAttributes,
                  }]
              : undefined;
          let can = canSplit(tr.doc, tr.mapping.map($from.pos), 1, types);
          if (!types
              && !can
              && canSplit(tr.doc, tr.mapping.map($from.pos), 1, deflt ? [{ type: deflt }] : undefined)) {
              can = true;
              types = deflt
                  ? [{
                          type: deflt,
                          attrs: newAttributes,
                      }]
                  : undefined;
          }
          if (can) {
              tr.split(tr.mapping.map($from.pos), 1, types);
              if (deflt
                  && !atEnd
                  && !$from.parentOffset
                  && $from.parent.type !== deflt) {
                  const first = tr.mapping.map($from.before());
                  const $first = tr.doc.resolve(first);
                  if ($from.node(-1).canReplaceWith($first.index(), $first.index() + 1, deflt)) {
                      tr.setNodeMarkup(tr.mapping.map($from.before()), deflt);
                  }
              }
          }
          if (keepMarks) {
              ensureMarks(state, editor.extensionManager.splittableMarks);
          }
          tr.scrollIntoView();
      }
      return true;
  };
  var splitBlock$1 = Object.freeze({
    __proto__: null,
    splitBlock: splitBlock
  });
  const splitListItem = typeOrName => ({ tr, state, dispatch, editor, }) => {
      var _a;
      const type = getNodeType(typeOrName, state.schema);
      const { $from, $to } = state.selection;
      const node = state.selection.node;
      if ((node && node.isBlock) || $from.depth < 2 || !$from.sameParent($to)) {
          return false;
      }
      const grandParent = $from.node(-1);
      if (grandParent.type !== type) {
          return false;
      }
      const extensionAttributes = editor.extensionManager.attributes;
      if ($from.parent.content.size === 0 && $from.node(-1).childCount === $from.indexAfter(-1)) {
          if ($from.depth === 2
              || $from.node(-3).type !== type
              || $from.index(-2) !== $from.node(-2).childCount - 1) {
              return false;
          }
          if (dispatch) {
              let wrap = Fragment.empty;
              const depthBefore = $from.index(-1)
                  ? 1
                  : $from.index(-2)
                      ? 2
                      : 3;
              for (let d = $from.depth - depthBefore; d >= $from.depth - 3; d -= 1) {
                  wrap = Fragment.from($from.node(d).copy(wrap));
              }
              const depthAfter = $from.indexAfter(-1) < $from.node(-2).childCount
                  ? 1
                  : $from.indexAfter(-2) < $from.node(-3).childCount
                      ? 2
                      : 3;
              const newNextTypeAttributes = getSplittedAttributes(extensionAttributes, $from.node().type.name, $from.node().attrs);
              const nextType = ((_a = type.contentMatch.defaultType) === null || _a === void 0 ? void 0 : _a.createAndFill(newNextTypeAttributes)) || undefined;
              wrap = wrap.append(Fragment.from(type.createAndFill(null, nextType) || undefined));
              const start = $from.before($from.depth - (depthBefore - 1));
              tr.replace(start, $from.after(-depthAfter), new Slice(wrap, 4 - depthBefore, 0));
              let sel = -1;
              tr.doc.nodesBetween(start, tr.doc.content.size, (n, pos) => {
                  if (sel > -1) {
                      return false;
                  }
                  if (n.isTextblock && n.content.size === 0) {
                      sel = pos + 1;
                  }
              });
              if (sel > -1) {
                  tr.setSelection(TextSelection.near(tr.doc.resolve(sel)));
              }
              tr.scrollIntoView();
          }
          return true;
      }
      const nextType = $to.pos === $from.end()
          ? grandParent.contentMatchAt(0).defaultType
          : null;
      const newTypeAttributes = getSplittedAttributes(extensionAttributes, grandParent.type.name, grandParent.attrs);
      const newNextTypeAttributes = getSplittedAttributes(extensionAttributes, $from.node().type.name, $from.node().attrs);
      tr.delete($from.pos, $to.pos);
      const types = nextType
          ? [{ type, attrs: newTypeAttributes }, { type: nextType, attrs: newNextTypeAttributes }]
          : [{ type, attrs: newTypeAttributes }];
      if (!canSplit(tr.doc, $from.pos, 2)) {
          return false;
      }
      if (dispatch) {
          tr.split($from.pos, 2, types).scrollIntoView();
      }
      return true;
  };
  var splitListItem$1 = Object.freeze({
    __proto__: null,
    splitListItem: splitListItem
  });
  function findParentNodeClosestToPos($pos, predicate) {
      for (let i = $pos.depth; i > 0; i -= 1) {
          const node = $pos.node(i);
          if (predicate(node)) {
              return {
                  pos: i > 0 ? $pos.before(i) : 0,
                  start: $pos.start(i),
                  depth: i,
                  node,
              };
          }
      }
  }
  function findParentNode(predicate) {
      return (selection) => findParentNodeClosestToPos(selection.$from, predicate);
  }
  function splitExtensions(extensions) {
      const baseExtensions = extensions.filter(extension => extension.type === 'extension');
      const nodeExtensions = extensions.filter(extension => extension.type === 'node');
      const markExtensions = extensions.filter(extension => extension.type === 'mark');
      return {
          baseExtensions,
          nodeExtensions,
          markExtensions,
      };
  }
  function isList(name, extensions) {
      const { nodeExtensions } = splitExtensions(extensions);
      const extension = nodeExtensions.find(item => item.name === name);
      if (!extension) {
          return false;
      }
      const context = {
          name: extension.name,
          options: extension.options,
          storage: extension.storage,
      };
      const group = callOrReturn(getExtensionField(extension, 'group', context));
      if (typeof group !== 'string') {
          return false;
      }
      return group.split(' ').includes('list');
  }
  const joinListBackwards = (tr, listType) => {
      const list = findParentNode(node => node.type === listType)(tr.selection);
      if (!list) {
          return true;
      }
      const before = tr.doc.resolve(Math.max(0, list.pos - 1)).before(list.depth);
      if (before === undefined) {
          return true;
      }
      const nodeBefore = tr.doc.nodeAt(before);
      const canJoinBackwards = list.node.type === (nodeBefore === null || nodeBefore === void 0 ? void 0 : nodeBefore.type)
          && canJoin(tr.doc, list.pos);
      if (!canJoinBackwards) {
          return true;
      }
      tr.join(list.pos);
      return true;
  };
  const joinListForwards = (tr, listType) => {
      const list = findParentNode(node => node.type === listType)(tr.selection);
      if (!list) {
          return true;
      }
      const after = tr.doc.resolve(list.start).after(list.depth);
      if (after === undefined) {
          return true;
      }
      const nodeAfter = tr.doc.nodeAt(after);
      const canJoinForwards = list.node.type === (nodeAfter === null || nodeAfter === void 0 ? void 0 : nodeAfter.type)
          && canJoin(tr.doc, after);
      if (!canJoinForwards) {
          return true;
      }
      tr.join(after);
      return true;
  };
  const toggleList = (listTypeOrName, itemTypeOrName) => ({ editor, tr, state, dispatch, chain, commands, can, }) => {
      const { extensions } = editor.extensionManager;
      const listType = getNodeType(listTypeOrName, state.schema);
      const itemType = getNodeType(itemTypeOrName, state.schema);
      const { selection } = state;
      const { $from, $to } = selection;
      const range = $from.blockRange($to);
      if (!range) {
          return false;
      }
      const parentList = findParentNode(node => isList(node.type.name, extensions))(selection);
      if (range.depth >= 1 && parentList && range.depth - parentList.depth <= 1) {
          if (parentList.node.type === listType) {
              return commands.liftListItem(itemType);
          }
          if (isList(parentList.node.type.name, extensions)
              && listType.validContent(parentList.node.content)
              && dispatch) {
              return chain()
                  .command(() => {
                  tr.setNodeMarkup(parentList.pos, listType);
                  return true;
              })
                  .command(() => joinListBackwards(tr, listType))
                  .command(() => joinListForwards(tr, listType))
                  .run();
          }
      }
      return chain()
          .command(() => {
          const canWrapInList = can().wrapInList(listType);
          if (canWrapInList) {
              return true;
          }
          return commands.clearNodes();
      })
          .wrapInList(listType)
          .command(() => joinListBackwards(tr, listType))
          .command(() => joinListForwards(tr, listType))
          .run();
  };
  var toggleList$1 = Object.freeze({
    __proto__: null,
    toggleList: toggleList
  });
  function isMarkActive(state, typeOrName, attributes = {}) {
      const { empty, ranges } = state.selection;
      const type = typeOrName
          ? getMarkType(typeOrName, state.schema)
          : null;
      if (empty) {
          return !!(state.storedMarks || state.selection.$from.marks())
              .filter(mark => {
              if (!type) {
                  return true;
              }
              return type.name === mark.type.name;
          })
              .find(mark => objectIncludes(mark.attrs, attributes, { strict: false }));
      }
      let selectionRange = 0;
      const markRanges = [];
      ranges.forEach(({ $from, $to }) => {
          const from = $from.pos;
          const to = $to.pos;
          state.doc.nodesBetween(from, to, (node, pos) => {
              if (!node.isText && !node.marks.length) {
                  return;
              }
              const relativeFrom = Math.max(from, pos);
              const relativeTo = Math.min(to, pos + node.nodeSize);
              const range = relativeTo - relativeFrom;
              selectionRange += range;
              markRanges.push(...node.marks.map(mark => ({
                  mark,
                  from: relativeFrom,
                  to: relativeTo,
              })));
          });
      });
      if (selectionRange === 0) {
          return false;
      }
      const matchedRange = markRanges
          .filter(markRange => {
          if (!type) {
              return true;
          }
          return type.name === markRange.mark.type.name;
      })
          .filter(markRange => objectIncludes(markRange.mark.attrs, attributes, { strict: false }))
          .reduce((sum, markRange) => sum + markRange.to - markRange.from, 0);
      const excludedRange = markRanges
          .filter(markRange => {
          if (!type) {
              return true;
          }
          return markRange.mark.type !== type
              && markRange.mark.type.excludes(type);
      })
          .reduce((sum, markRange) => sum + markRange.to - markRange.from, 0);
      const range = matchedRange > 0
          ? matchedRange + excludedRange
          : matchedRange;
      return range >= selectionRange;
  }
  const toggleMark = (typeOrName, attributes = {}, options = {}) => ({ state, commands }) => {
      const { extendEmptyMarkRange = false } = options;
      const type = getMarkType(typeOrName, state.schema);
      const isActive = isMarkActive(state, type, attributes);
      if (isActive) {
          return commands.unsetMark(type, { extendEmptyMarkRange });
      }
      return commands.setMark(type, attributes);
  };
  var toggleMark$1 = Object.freeze({
    __proto__: null,
    toggleMark: toggleMark
  });
  const toggleNode = (typeOrName, toggleTypeOrName, attributes = {}) => ({ state, commands }) => {
      const type = getNodeType(typeOrName, state.schema);
      const toggleType = getNodeType(toggleTypeOrName, state.schema);
      const isActive = isNodeActive(state, type, attributes);
      if (isActive) {
          return commands.setNode(toggleType);
      }
      return commands.setNode(type, attributes);
  };
  var toggleNode$1 = Object.freeze({
    __proto__: null,
    toggleNode: toggleNode
  });
  const toggleWrap = (typeOrName, attributes = {}) => ({ state, commands }) => {
      const type = getNodeType(typeOrName, state.schema);
      const isActive = isNodeActive(state, type, attributes);
      if (isActive) {
          return commands.lift(type);
      }
      return commands.wrapIn(type, attributes);
  };
  var toggleWrap$1 = Object.freeze({
    __proto__: null,
    toggleWrap: toggleWrap
  });
  const undoInputRule = () => ({ state, dispatch }) => {
      const plugins = state.plugins;
      for (let i = 0; i < plugins.length; i += 1) {
          const plugin = plugins[i];
          let undoable;
          if (plugin.spec.isInputRules && (undoable = plugin.getState(state))) {
              if (dispatch) {
                  const tr = state.tr;
                  const toUndo = undoable.transform;
                  for (let j = toUndo.steps.length - 1; j >= 0; j -= 1) {
                      tr.step(toUndo.steps[j].invert(toUndo.docs[j]));
                  }
                  if (undoable.text) {
                      const marks = tr.doc.resolve(undoable.from).marks();
                      tr.replaceWith(undoable.from, undoable.to, state.schema.text(undoable.text, marks));
                  }
                  else {
                      tr.delete(undoable.from, undoable.to);
                  }
              }
              return true;
          }
      }
      return false;
  };
  var undoInputRule$1 = Object.freeze({
    __proto__: null,
    undoInputRule: undoInputRule
  });
  const unsetAllMarks = () => ({ tr, dispatch }) => {
      const { selection } = tr;
      const { empty, ranges } = selection;
      if (empty) {
          return true;
      }
      if (dispatch) {
          ranges.forEach(range => {
              tr.removeMark(range.$from.pos, range.$to.pos);
          });
      }
      return true;
  };
  var unsetAllMarks$1 = Object.freeze({
    __proto__: null,
    unsetAllMarks: unsetAllMarks
  });
  const unsetMark = (typeOrName, options = {}) => ({ tr, state, dispatch }) => {
      var _a;
      const { extendEmptyMarkRange = false } = options;
      const { selection } = tr;
      const type = getMarkType(typeOrName, state.schema);
      const { $from, empty, ranges } = selection;
      if (!dispatch) {
          return true;
      }
      if (empty && extendEmptyMarkRange) {
          let { from, to } = selection;
          const attrs = (_a = $from.marks().find(mark => mark.type === type)) === null || _a === void 0 ? void 0 : _a.attrs;
          const range = getMarkRange($from, type, attrs);
          if (range) {
              from = range.from;
              to = range.to;
          }
          tr.removeMark(from, to, type);
      }
      else {
          ranges.forEach(range => {
              tr.removeMark(range.$from.pos, range.$to.pos, type);
          });
      }
      tr.removeStoredMark(type);
      return true;
  };
  var unsetMark$1 = Object.freeze({
    __proto__: null,
    unsetMark: unsetMark
  });
  const updateAttributes = (typeOrName, attributes = {}) => ({ tr, state, dispatch }) => {
      let nodeType = null;
      let markType = null;
      const schemaType = getSchemaTypeNameByName(typeof typeOrName === 'string'
          ? typeOrName
          : typeOrName.name, state.schema);
      if (!schemaType) {
          return false;
      }
      if (schemaType === 'node') {
          nodeType = getNodeType(typeOrName, state.schema);
      }
      if (schemaType === 'mark') {
          markType = getMarkType(typeOrName, state.schema);
      }
      if (dispatch) {
          tr.selection.ranges.forEach(range => {
              const from = range.$from.pos;
              const to = range.$to.pos;
              state.doc.nodesBetween(from, to, (node, pos) => {
                  if (nodeType && nodeType === node.type) {
                      tr.setNodeMarkup(pos, undefined, {
                          ...node.attrs,
                          ...attributes,
                      });
                  }
                  if (markType && node.marks.length) {
                      node.marks.forEach(mark => {
                          if (markType === mark.type) {
                              const trimmedFrom = Math.max(pos, from);
                              const trimmedTo = Math.min(pos + node.nodeSize, to);
                              tr.addMark(trimmedFrom, trimmedTo, markType.create({
                                  ...mark.attrs,
                                  ...attributes,
                              }));
                          }
                      });
                  }
              });
          });
      }
      return true;
  };
  var updateAttributes$1 = Object.freeze({
    __proto__: null,
    updateAttributes: updateAttributes
  });
  const wrapIn = (typeOrName, attributes = {}) => ({ state, dispatch }) => {
      const type = getNodeType(typeOrName, state.schema);
      return wrapIn$2(type, attributes)(state, dispatch);
  };
  var wrapIn$1 = Object.freeze({
    __proto__: null,
    wrapIn: wrapIn
  });
  const wrapInList = (typeOrName, attributes = {}) => ({ state, dispatch }) => {
      const type = getNodeType(typeOrName, state.schema);
      return wrapInList$2(type, attributes)(state, dispatch);
  };
  var wrapInList$1 = Object.freeze({
    __proto__: null,
    wrapInList: wrapInList
  });
  const Commands = Extension.create({
      name: 'commands',
      addCommands() {
          return {
              ...blur$1,
              ...clearContent$1,
              ...clearNodes$1,
              ...command$1,
              ...createParagraphNear$1,
              ...deleteNode$1,
              ...deleteRange$1,
              ...deleteSelection$1,
              ...enter$1,
              ...exitCode$1,
              ...extendMarkRange$1,
              ...first$1,
              ...focus$1,
              ...forEach$1,
              ...insertContent$1,
              ...insertContentAt$1,
              ...joinBackward$1,
              ...joinForward$1,
              ...keyboardShortcut$1,
              ...lift$1,
              ...liftEmptyBlock$1,
              ...liftListItem$1,
              ...newlineInCode$1,
              ...resetAttributes$1,
              ...scrollIntoView$1,
              ...selectAll$1,
              ...selectNodeBackward$1,
              ...selectNodeForward$1,
              ...selectParentNode$1,
              ...selectTextblockEnd$1,
              ...selectTextblockStart$1,
              ...setContent$1,
              ...setMark$1,
              ...setMeta$1,
              ...setNode$1,
              ...setNodeSelection$1,
              ...setTextSelection$1,
              ...sinkListItem$1,
              ...splitBlock$1,
              ...splitListItem$1,
              ...toggleList$1,
              ...toggleMark$1,
              ...toggleNode$1,
              ...toggleWrap$1,
              ...undoInputRule$1,
              ...unsetAllMarks$1,
              ...unsetMark$1,
              ...updateAttributes$1,
              ...wrapIn$1,
              ...wrapInList$1,
          };
      },
  });
  const Editable = Extension.create({
      name: 'editable',
      addProseMirrorPlugins() {
          return [
              new Plugin({
                  key: new PluginKey('editable'),
                  props: {
                      editable: () => this.editor.options.editable,
                  },
              }),
          ];
      },
  });
  const FocusEvents = Extension.create({
      name: 'focusEvents',
      addProseMirrorPlugins() {
          const { editor } = this;
          return [
              new Plugin({
                  key: new PluginKey('focusEvents'),
                  props: {
                      handleDOMEvents: {
                          focus: (view, event) => {
                              editor.isFocused = true;
                              const transaction = editor.state.tr
                                  .setMeta('focus', { event })
                                  .setMeta('addToHistory', false);
                              view.dispatch(transaction);
                              return false;
                          },
                          blur: (view, event) => {
                              editor.isFocused = false;
                              const transaction = editor.state.tr
                                  .setMeta('blur', { event })
                                  .setMeta('addToHistory', false);
                              view.dispatch(transaction);
                              return false;
                          },
                      },
                  },
              }),
          ];
      },
  });
  function createChainableState(config) {
      const { state, transaction } = config;
      let { selection } = transaction;
      let { doc } = transaction;
      let { storedMarks } = transaction;
      return {
          ...state,
          schema: state.schema,
          plugins: state.plugins,
          apply: state.apply.bind(state),
          applyTransaction: state.applyTransaction.bind(state),
          reconfigure: state.reconfigure.bind(state),
          toJSON: state.toJSON.bind(state),
          get storedMarks() {
              return storedMarks;
          },
          get selection() {
              return selection;
          },
          get doc() {
              return doc;
          },
          get tr() {
              selection = transaction.selection;
              doc = transaction.doc;
              storedMarks = transaction.storedMarks;
              return transaction;
          },
      };
  }
  class CommandManager {
      constructor(props) {
          this.editor = props.editor;
          this.rawCommands = this.editor.extensionManager.commands;
          this.customState = props.state;
      }
      get hasCustomState() {
          return !!this.customState;
      }
      get state() {
          return this.customState || this.editor.state;
      }
      get commands() {
          const { rawCommands, editor, state } = this;
          const { view } = editor;
          const { tr } = state;
          const props = this.buildProps(tr);
          return Object.fromEntries(Object
              .entries(rawCommands)
              .map(([name, command]) => {
              const method = (...args) => {
                  const callback = command(...args)(props);
                  if (!tr.getMeta('preventDispatch') && !this.hasCustomState) {
                      view.dispatch(tr);
                  }
                  return callback;
              };
              return [name, method];
          }));
      }
      get chain() {
          return () => this.createChain();
      }
      get can() {
          return () => this.createCan();
      }
      createChain(startTr, shouldDispatch = true) {
          const { rawCommands, editor, state } = this;
          const { view } = editor;
          const callbacks = [];
          const hasStartTransaction = !!startTr;
          const tr = startTr || state.tr;
          const run = () => {
              if (!hasStartTransaction
                  && shouldDispatch
                  && !tr.getMeta('preventDispatch')
                  && !this.hasCustomState) {
                  view.dispatch(tr);
              }
              return callbacks.every(callback => callback === true);
          };
          const chain = {
              ...Object.fromEntries(Object.entries(rawCommands).map(([name, command]) => {
                  const chainedCommand = (...args) => {
                      const props = this.buildProps(tr, shouldDispatch);
                      const callback = command(...args)(props);
                      callbacks.push(callback);
                      return chain;
                  };
                  return [name, chainedCommand];
              })),
              run,
          };
          return chain;
      }
      createCan(startTr) {
          const { rawCommands, state } = this;
          const dispatch = undefined;
          const tr = startTr || state.tr;
          const props = this.buildProps(tr, dispatch);
          const formattedCommands = Object.fromEntries(Object
              .entries(rawCommands)
              .map(([name, command]) => {
              return [name, (...args) => command(...args)({ ...props, dispatch })];
          }));
          return {
              ...formattedCommands,
              chain: () => this.createChain(tr, dispatch),
          };
      }
      buildProps(tr, shouldDispatch = true) {
          const { rawCommands, editor, state } = this;
          const { view } = editor;
          if (state.storedMarks) {
              tr.setStoredMarks(state.storedMarks);
          }
          const props = {
              tr,
              editor,
              view,
              state: createChainableState({
                  state,
                  transaction: tr,
              }),
              dispatch: shouldDispatch
                  ? () => undefined
                  : undefined,
              chain: () => this.createChain(tr),
              can: () => this.createCan(tr),
              get commands() {
                  return Object.fromEntries(Object
                      .entries(rawCommands)
                      .map(([name, command]) => {
                      return [name, (...args) => command(...args)(props)];
                  }));
              },
          };
          return props;
      }
  }
  const Keymap = Extension.create({
      name: 'keymap',
      addKeyboardShortcuts() {
          const handleBackspace = () => this.editor.commands.first(({ commands }) => [
              () => commands.undoInputRule(),
              () => commands.command(({ tr }) => {
                  const { selection, doc } = tr;
                  const { empty, $anchor } = selection;
                  const { pos, parent } = $anchor;
                  const isAtStart = Selection.atStart(doc).from === pos;
                  if (!empty
                      || !isAtStart
                      || !parent.type.isTextblock
                      || parent.textContent.length) {
                      return false;
                  }
                  return commands.clearNodes();
              }),
              () => commands.deleteSelection(),
              () => commands.joinBackward(),
              () => commands.selectNodeBackward(),
          ]);
          const handleDelete = () => this.editor.commands.first(({ commands }) => [
              () => commands.deleteSelection(),
              () => commands.joinForward(),
              () => commands.selectNodeForward(),
          ]);
          const handleEnter = () => this.editor.commands.first(({ commands }) => [
              () => commands.newlineInCode(),
              () => commands.createParagraphNear(),
              () => commands.liftEmptyBlock(),
              () => commands.splitBlock(),
          ]);
          const baseKeymap = {
              Enter: handleEnter,
              'Mod-Enter': () => this.editor.commands.exitCode(),
              Backspace: handleBackspace,
              'Mod-Backspace': handleBackspace,
              'Shift-Backspace': handleBackspace,
              Delete: handleDelete,
              'Mod-Delete': handleDelete,
              'Mod-a': () => this.editor.commands.selectAll(),
          };
          const pcKeymap = {
              ...baseKeymap,
              Home: () => this.editor.commands.selectTextblockStart(),
              End: () => this.editor.commands.selectTextblockEnd(),
          };
          const macKeymap = {
              ...baseKeymap,
              'Ctrl-h': handleBackspace,
              'Alt-Backspace': handleBackspace,
              'Ctrl-d': handleDelete,
              'Ctrl-Alt-Backspace': handleDelete,
              'Alt-Delete': handleDelete,
              'Alt-d': handleDelete,
              'Ctrl-a': () => this.editor.commands.selectTextblockStart(),
              'Ctrl-e': () => this.editor.commands.selectTextblockEnd(),
          };
          if (isiOS() || isMacOS()) {
              return macKeymap;
          }
          return pcKeymap;
      },
      addProseMirrorPlugins() {
          return [
              new Plugin({
                  key: new PluginKey('clearDocument'),
                  appendTransaction: (transactions, oldState, newState) => {
                      const docChanges = transactions.some(transaction => transaction.docChanged)
                          && !oldState.doc.eq(newState.doc);
                      if (!docChanges) {
                          return;
                      }
                      const { empty, from, to } = oldState.selection;
                      const allFrom = Selection.atStart(oldState.doc).from;
                      const allEnd = Selection.atEnd(oldState.doc).to;
                      const allWasSelected = from === allFrom && to === allEnd;
                      const isEmpty = newState.doc.textBetween(0, newState.doc.content.size, ' ', ' ').length === 0;
                      if (empty || !allWasSelected || !isEmpty) {
                          return;
                      }
                      const tr = newState.tr;
                      const state = createChainableState({
                          state: newState,
                          transaction: tr,
                      });
                      const { commands } = new CommandManager({
                          editor: this.editor,
                          state,
                      });
                      commands.clearNodes();
                      if (!tr.steps.length) {
                          return;
                      }
                      return tr;
                  },
              }),
          ];
      },
  });
  const Tabindex = Extension.create({
      name: 'tabindex',
      addProseMirrorPlugins() {
          return [
              new Plugin({
                  key: new PluginKey('tabindex'),
                  props: {
                      attributes: () => {
                          if (this.editor.isEditable) {
                              return {
                                  tabindex: '0',
                              };
                          }
                      },
                  },
              }),
          ];
      },
  });
  var extensions = Object.freeze({
    __proto__: null,
    ClipboardTextSerializer: ClipboardTextSerializer,
    Commands: Commands,
    Editable: Editable,
    FocusEvents: FocusEvents,
    Keymap: Keymap,
    Tabindex: Tabindex
  });
  function getNodeAttributes(state, typeOrName) {
      const type = getNodeType(typeOrName, state.schema);
      const { from, to } = state.selection;
      const nodes = [];
      state.doc.nodesBetween(from, to, node => {
          nodes.push(node);
      });
      const node = nodes
          .reverse()
          .find(nodeItem => nodeItem.type.name === type.name);
      if (!node) {
          return {};
      }
      return { ...node.attrs };
  }
  function getAttributes(state, typeOrName) {
      const schemaType = getSchemaTypeNameByName(typeof typeOrName === 'string'
          ? typeOrName
          : typeOrName.name, state.schema);
      if (schemaType === 'node') {
          return getNodeAttributes(state, typeOrName);
      }
      if (schemaType === 'mark') {
          return getMarkAttributes(state, typeOrName);
      }
      return {};
  }
  function isActive(state, name, attributes = {}) {
      if (!name) {
          return isNodeActive(state, null, attributes) || isMarkActive(state, null, attributes);
      }
      const schemaType = getSchemaTypeNameByName(name, state.schema);
      if (schemaType === 'node') {
          return isNodeActive(state, name, attributes);
      }
      if (schemaType === 'mark') {
          return isMarkActive(state, name, attributes);
      }
      return false;
  }
  function getHTMLFromFragment(fragment, schema) {
      const documentFragment = DOMSerializer
          .fromSchema(schema)
          .serializeFragment(fragment);
      const temporaryDocument = document.implementation.createHTMLDocument();
      const container = temporaryDocument.createElement('div');
      container.appendChild(documentFragment);
      return container.innerHTML;
  }
  function getText(node, options) {
      const range = {
          from: 0,
          to: node.content.size,
      };
      return getTextBetween(node, range, options);
  }
  function isNodeEmpty(node) {
      var _a;
      const defaultContent = (_a = node.type.createAndFill()) === null || _a === void 0 ? void 0 : _a.toJSON();
      const content = node.toJSON();
      return JSON.stringify(defaultContent) === JSON.stringify(content);
  }
  function createStyleTag(style) {
      const tipTapStyleTag = document.querySelector('style[data-tiptap-style]');
      if (tipTapStyleTag !== null) {
          return tipTapStyleTag;
      }
      const styleNode = document.createElement('style');
      styleNode.setAttribute('data-tiptap-style', '');
      styleNode.innerHTML = style;
      document.getElementsByTagName('head')[0].appendChild(styleNode);
      return styleNode;
  }
  class InputRule {
      constructor(config) {
          this.find = config.find;
          this.handler = config.handler;
      }
  }
  const inputRuleMatcherHandler = (text, find) => {
      if (isRegExp(find)) {
          return find.exec(text);
      }
      const inputRuleMatch = find(text);
      if (!inputRuleMatch) {
          return null;
      }
      const result = [];
      result.push(inputRuleMatch.text);
      result.index = inputRuleMatch.index;
      result.input = text;
      result.data = inputRuleMatch.data;
      if (inputRuleMatch.replaceWith) {
          if (!inputRuleMatch.text.includes(inputRuleMatch.replaceWith)) {
              console.warn('[tiptap warn]: "inputRuleMatch.replaceWith" must be part of "inputRuleMatch.text".');
          }
          result.push(inputRuleMatch.replaceWith);
      }
      return result;
  };
  function run$1$1(config) {
      var _a;
      const { editor, from, to, text, rules, plugin, } = config;
      const { view } = editor;
      if (view.composing) {
          return false;
      }
      const $from = view.state.doc.resolve(from);
      if (
      $from.parent.type.spec.code
          || !!((_a = ($from.nodeBefore || $from.nodeAfter)) === null || _a === void 0 ? void 0 : _a.marks.find(mark => mark.type.spec.code))) {
          return false;
      }
      let matched = false;
      const maxMatch = 500;
      const textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - maxMatch), $from.parentOffset, undefined, ' ') + text;
      rules.forEach(rule => {
          if (matched) {
              return;
          }
          const match = inputRuleMatcherHandler(textBefore, rule.find);
          if (!match) {
              return;
          }
          const tr = view.state.tr;
          const state = createChainableState({
              state: view.state,
              transaction: tr,
          });
          const range = {
              from: from - (match[0].length - text.length),
              to,
          };
          const { commands, chain, can } = new CommandManager({
              editor,
              state,
          });
          const handler = rule.handler({
              state,
              range,
              match,
              commands,
              chain,
              can,
          });
          if (handler === null || !tr.steps.length) {
              return;
          }
          tr.setMeta(plugin, {
              transform: tr,
              from,
              to,
              text,
          });
          view.dispatch(tr);
          matched = true;
      });
      return matched;
  }
  function inputRulesPlugin(props) {
      const { editor, rules } = props;
      const plugin = new Plugin({
          state: {
              init() {
                  return null;
              },
              apply(tr, prev) {
                  const stored = tr.getMeta(this);
                  if (stored) {
                      return stored;
                  }
                  return tr.selectionSet || tr.docChanged
                      ? null
                      : prev;
              },
          },
          props: {
              handleTextInput(view, from, to, text) {
                  return run$1$1({
                      editor,
                      from,
                      to,
                      text,
                      rules,
                      plugin,
                  });
              },
              handleDOMEvents: {
                  compositionend: view => {
                      setTimeout(() => {
                          const { $cursor } = view.state.selection;
                          if ($cursor) {
                              run$1$1({
                                  editor,
                                  from: $cursor.pos,
                                  to: $cursor.pos,
                                  text: '',
                                  rules,
                                  plugin,
                              });
                          }
                      });
                      return false;
                  },
              },
              handleKeyDown(view, event) {
                  if (event.key !== 'Enter') {
                      return false;
                  }
                  const { $cursor } = view.state.selection;
                  if ($cursor) {
                      return run$1$1({
                          editor,
                          from: $cursor.pos,
                          to: $cursor.pos,
                          text: '\n',
                          rules,
                          plugin,
                      });
                  }
                  return false;
              },
          },
          isInputRules: true,
      });
      return plugin;
  }
  function isNumber(value) {
      return typeof value === 'number';
  }
  class PasteRule {
      constructor(config) {
          this.find = config.find;
          this.handler = config.handler;
      }
  }
  const pasteRuleMatcherHandler = (text, find) => {
      if (isRegExp(find)) {
          return [...text.matchAll(find)];
      }
      const matches = find(text);
      if (!matches) {
          return [];
      }
      return matches.map(pasteRuleMatch => {
          const result = [];
          result.push(pasteRuleMatch.text);
          result.index = pasteRuleMatch.index;
          result.input = text;
          result.data = pasteRuleMatch.data;
          if (pasteRuleMatch.replaceWith) {
              if (!pasteRuleMatch.text.includes(pasteRuleMatch.replaceWith)) {
                  console.warn('[tiptap warn]: "pasteRuleMatch.replaceWith" must be part of "pasteRuleMatch.text".');
              }
              result.push(pasteRuleMatch.replaceWith);
          }
          return result;
      });
  };
  function run$2(config) {
      const { editor, state, from, to, rule, } = config;
      const { commands, chain, can } = new CommandManager({
          editor,
          state,
      });
      const handlers = [];
      state.doc.nodesBetween(from, to, (node, pos) => {
          if (!node.isTextblock || node.type.spec.code) {
              return;
          }
          const resolvedFrom = Math.max(from, pos);
          const resolvedTo = Math.min(to, pos + node.content.size);
          const textToMatch = node.textBetween(resolvedFrom - pos, resolvedTo - pos, undefined, '\ufffc');
          const matches = pasteRuleMatcherHandler(textToMatch, rule.find);
          matches.forEach(match => {
              if (match.index === undefined) {
                  return;
              }
              const start = resolvedFrom + match.index + 1;
              const end = start + match[0].length;
              const range = {
                  from: state.tr.mapping.map(start),
                  to: state.tr.mapping.map(end),
              };
              const handler = rule.handler({
                  state,
                  range,
                  match,
                  commands,
                  chain,
                  can,
              });
              handlers.push(handler);
          });
      });
      const success = handlers.every(handler => handler !== null);
      return success;
  }
  function pasteRulesPlugin(props) {
      const { editor, rules } = props;
      let dragSourceElement = null;
      let isPastedFromProseMirror = false;
      let isDroppedFromProseMirror = false;
      const plugins = rules.map(rule => {
          return new Plugin({
              view(view) {
                  const handleDragstart = (event) => {
                      var _a;
                      dragSourceElement = ((_a = view.dom.parentElement) === null || _a === void 0 ? void 0 : _a.contains(event.target))
                          ? view.dom.parentElement
                          : null;
                  };
                  window.addEventListener('dragstart', handleDragstart);
                  return {
                      destroy() {
                          window.removeEventListener('dragstart', handleDragstart);
                      },
                  };
              },
              props: {
                  handleDOMEvents: {
                      drop: view => {
                          isDroppedFromProseMirror = dragSourceElement === view.dom.parentElement;
                          return false;
                      },
                      paste: (view, event) => {
                          var _a;
                          const html = (_a = event.clipboardData) === null || _a === void 0 ? void 0 : _a.getData('text/html');
                          isPastedFromProseMirror = !!(html === null || html === void 0 ? void 0 : html.includes('data-pm-slice'));
                          return false;
                      },
                  },
              },
              appendTransaction: (transactions, oldState, state) => {
                  const transaction = transactions[0];
                  const isPaste = transaction.getMeta('uiEvent') === 'paste' && !isPastedFromProseMirror;
                  const isDrop = transaction.getMeta('uiEvent') === 'drop' && !isDroppedFromProseMirror;
                  if (!isPaste && !isDrop) {
                      return;
                  }
                  const from = oldState.doc.content.findDiffStart(state.doc.content);
                  const to = oldState.doc.content.findDiffEnd(state.doc.content);
                  if (!isNumber(from) || !to || from === to.b) {
                      return;
                  }
                  const tr = state.tr;
                  const chainableState = createChainableState({
                      state,
                      transaction: tr,
                  });
                  const handler = run$2({
                      editor,
                      state: chainableState,
                      from: Math.max(from - 1, 0),
                      to: to.b,
                      rule,
                  });
                  if (!handler || !tr.steps.length) {
                      return;
                  }
                  return tr;
              },
          });
      });
      return plugins;
  }
  function getAttributesFromExtensions(extensions) {
      const extensionAttributes = [];
      const { nodeExtensions, markExtensions } = splitExtensions(extensions);
      const nodeAndMarkExtensions = [...nodeExtensions, ...markExtensions];
      const defaultAttribute = {
          default: null,
          rendered: true,
          renderHTML: null,
          parseHTML: null,
          keepOnSplit: true,
      };
      extensions.forEach(extension => {
          const context = {
              name: extension.name,
              options: extension.options,
              storage: extension.storage,
          };
          const addGlobalAttributes = getExtensionField(extension, 'addGlobalAttributes', context);
          if (!addGlobalAttributes) {
              return;
          }
          const globalAttributes = addGlobalAttributes();
          globalAttributes.forEach(globalAttribute => {
              globalAttribute.types.forEach(type => {
                  Object
                      .entries(globalAttribute.attributes)
                      .forEach(([name, attribute]) => {
                      extensionAttributes.push({
                          type,
                          name,
                          attribute: {
                              ...defaultAttribute,
                              ...attribute,
                          },
                      });
                  });
              });
          });
      });
      nodeAndMarkExtensions.forEach(extension => {
          const context = {
              name: extension.name,
              options: extension.options,
              storage: extension.storage,
          };
          const addAttributes = getExtensionField(extension, 'addAttributes', context);
          if (!addAttributes) {
              return;
          }
          const attributes = addAttributes();
          Object
              .entries(attributes)
              .forEach(([name, attribute]) => {
              extensionAttributes.push({
                  type: extension.name,
                  name,
                  attribute: {
                      ...defaultAttribute,
                      ...attribute,
                  },
              });
          });
      });
      return extensionAttributes;
  }
  function mergeAttributes(...objects) {
      return objects
          .filter(item => !!item)
          .reduce((items, item) => {
          const mergedAttributes = { ...items };
          Object.entries(item).forEach(([key, value]) => {
              const exists = mergedAttributes[key];
              if (!exists) {
                  mergedAttributes[key] = value;
                  return;
              }
              if (key === 'class') {
                  mergedAttributes[key] = [mergedAttributes[key], value].join(' ');
              }
              else if (key === 'style') {
                  mergedAttributes[key] = [mergedAttributes[key], value].join('; ');
              }
              else {
                  mergedAttributes[key] = value;
              }
          });
          return mergedAttributes;
      }, {});
  }
  function getRenderedAttributes(nodeOrMark, extensionAttributes) {
      return extensionAttributes
          .filter(item => item.attribute.rendered)
          .map(item => {
          if (!item.attribute.renderHTML) {
              return {
                  [item.name]: nodeOrMark.attrs[item.name],
              };
          }
          return item.attribute.renderHTML(nodeOrMark.attrs) || {};
      })
          .reduce((attributes, attribute) => mergeAttributes(attributes, attribute), {});
  }
  function isEmptyObject(value = {}) {
      return Object.keys(value).length === 0 && value.constructor === Object;
  }
  function fromString(value) {
      if (typeof value !== 'string') {
          return value;
      }
      if (value.match(/^[+-]?(?:\d*\.)?\d+$/)) {
          return Number(value);
      }
      if (value === 'true') {
          return true;
      }
      if (value === 'false') {
          return false;
      }
      return value;
  }
  function injectExtensionAttributesToParseRule(parseRule, extensionAttributes) {
      if (parseRule.style) {
          return parseRule;
      }
      return {
          ...parseRule,
          getAttrs: node => {
              const oldAttributes = parseRule.getAttrs
                  ? parseRule.getAttrs(node)
                  : parseRule.attrs;
              if (oldAttributes === false) {
                  return false;
              }
              const newAttributes = extensionAttributes.reduce((items, item) => {
                  const value = item.attribute.parseHTML
                      ? item.attribute.parseHTML(node)
                      : fromString(node.getAttribute(item.name));
                  if (value === null || value === undefined) {
                      return items;
                  }
                  return {
                      ...items,
                      [item.name]: value,
                  };
              }, {});
              return { ...oldAttributes, ...newAttributes };
          },
      };
  }
  function cleanUpSchemaItem(data) {
      return Object.fromEntries(Object.entries(data).filter(([key, value]) => {
          if (key === 'attrs' && isEmptyObject(value)) {
              return false;
          }
          return value !== null && value !== undefined;
      }));
  }
  function getSchemaByResolvedExtensions(extensions) {
      var _a;
      const allAttributes = getAttributesFromExtensions(extensions);
      const { nodeExtensions, markExtensions } = splitExtensions(extensions);
      const topNode = (_a = nodeExtensions.find(extension => getExtensionField(extension, 'topNode'))) === null || _a === void 0 ? void 0 : _a.name;
      const nodes = Object.fromEntries(nodeExtensions.map(extension => {
          const extensionAttributes = allAttributes.filter(attribute => attribute.type === extension.name);
          const context = {
              name: extension.name,
              options: extension.options,
              storage: extension.storage,
          };
          const extraNodeFields = extensions.reduce((fields, e) => {
              const extendNodeSchema = getExtensionField(e, 'extendNodeSchema', context);
              return {
                  ...fields,
                  ...(extendNodeSchema ? extendNodeSchema(extension) : {}),
              };
          }, {});
          const schema = cleanUpSchemaItem({
              ...extraNodeFields,
              content: callOrReturn(getExtensionField(extension, 'content', context)),
              marks: callOrReturn(getExtensionField(extension, 'marks', context)),
              group: callOrReturn(getExtensionField(extension, 'group', context)),
              inline: callOrReturn(getExtensionField(extension, 'inline', context)),
              atom: callOrReturn(getExtensionField(extension, 'atom', context)),
              selectable: callOrReturn(getExtensionField(extension, 'selectable', context)),
              draggable: callOrReturn(getExtensionField(extension, 'draggable', context)),
              code: callOrReturn(getExtensionField(extension, 'code', context)),
              defining: callOrReturn(getExtensionField(extension, 'defining', context)),
              isolating: callOrReturn(getExtensionField(extension, 'isolating', context)),
              attrs: Object.fromEntries(extensionAttributes.map(extensionAttribute => {
                  var _a;
                  return [extensionAttribute.name, { default: (_a = extensionAttribute === null || extensionAttribute === void 0 ? void 0 : extensionAttribute.attribute) === null || _a === void 0 ? void 0 : _a.default }];
              })),
          });
          const parseHTML = callOrReturn(getExtensionField(extension, 'parseHTML', context));
          if (parseHTML) {
              schema.parseDOM = parseHTML
                  .map(parseRule => injectExtensionAttributesToParseRule(parseRule, extensionAttributes));
          }
          const renderHTML = getExtensionField(extension, 'renderHTML', context);
          if (renderHTML) {
              schema.toDOM = node => renderHTML({
                  node,
                  HTMLAttributes: getRenderedAttributes(node, extensionAttributes),
              });
          }
          const renderText = getExtensionField(extension, 'renderText', context);
          if (renderText) {
              schema.toText = renderText;
          }
          return [extension.name, schema];
      }));
      const marks = Object.fromEntries(markExtensions.map(extension => {
          const extensionAttributes = allAttributes.filter(attribute => attribute.type === extension.name);
          const context = {
              name: extension.name,
              options: extension.options,
              storage: extension.storage,
          };
          const extraMarkFields = extensions.reduce((fields, e) => {
              const extendMarkSchema = getExtensionField(e, 'extendMarkSchema', context);
              return {
                  ...fields,
                  ...(extendMarkSchema ? extendMarkSchema(extension) : {}),
              };
          }, {});
          const schema = cleanUpSchemaItem({
              ...extraMarkFields,
              inclusive: callOrReturn(getExtensionField(extension, 'inclusive', context)),
              excludes: callOrReturn(getExtensionField(extension, 'excludes', context)),
              group: callOrReturn(getExtensionField(extension, 'group', context)),
              spanning: callOrReturn(getExtensionField(extension, 'spanning', context)),
              code: callOrReturn(getExtensionField(extension, 'code', context)),
              attrs: Object.fromEntries(extensionAttributes.map(extensionAttribute => {
                  var _a;
                  return [extensionAttribute.name, { default: (_a = extensionAttribute === null || extensionAttribute === void 0 ? void 0 : extensionAttribute.attribute) === null || _a === void 0 ? void 0 : _a.default }];
              })),
          });
          const parseHTML = callOrReturn(getExtensionField(extension, 'parseHTML', context));
          if (parseHTML) {
              schema.parseDOM = parseHTML
                  .map(parseRule => injectExtensionAttributesToParseRule(parseRule, extensionAttributes));
          }
          const renderHTML = getExtensionField(extension, 'renderHTML', context);
          if (renderHTML) {
              schema.toDOM = mark => renderHTML({
                  mark,
                  HTMLAttributes: getRenderedAttributes(mark, extensionAttributes),
              });
          }
          return [extension.name, schema];
      }));
      return new Schema({
          topNode,
          nodes,
          marks,
      });
  }
  function getSchemaTypeByName(name, schema) {
      return schema.nodes[name] || schema.marks[name] || null;
  }
  function isExtensionRulesEnabled(extension, enabled) {
      if (Array.isArray(enabled)) {
          return enabled.some(enabledExtension => {
              const name = typeof enabledExtension === 'string'
                  ? enabledExtension
                  : enabledExtension.name;
              return name === extension.name;
          });
      }
      return enabled;
  }
  function findDuplicates(items) {
      const filtered = items.filter((el, index) => items.indexOf(el) !== index);
      return [...new Set(filtered)];
  }
  class ExtensionManager {
      constructor(extensions, editor) {
          this.splittableMarks = [];
          this.editor = editor;
          this.extensions = ExtensionManager.resolve(extensions);
          this.schema = getSchemaByResolvedExtensions(this.extensions);
          this.extensions.forEach(extension => {
              var _a;
              this.editor.extensionStorage[extension.name] = extension.storage;
              const context = {
                  name: extension.name,
                  options: extension.options,
                  storage: extension.storage,
                  editor: this.editor,
                  type: getSchemaTypeByName(extension.name, this.schema),
              };
              if (extension.type === 'mark') {
                  const keepOnSplit = (_a = callOrReturn(getExtensionField(extension, 'keepOnSplit', context))) !== null && _a !== void 0 ? _a : true;
                  if (keepOnSplit) {
                      this.splittableMarks.push(extension.name);
                  }
              }
              const onBeforeCreate = getExtensionField(extension, 'onBeforeCreate', context);
              if (onBeforeCreate) {
                  this.editor.on('beforeCreate', onBeforeCreate);
              }
              const onCreate = getExtensionField(extension, 'onCreate', context);
              if (onCreate) {
                  this.editor.on('create', onCreate);
              }
              const onUpdate = getExtensionField(extension, 'onUpdate', context);
              if (onUpdate) {
                  this.editor.on('update', onUpdate);
              }
              const onSelectionUpdate = getExtensionField(extension, 'onSelectionUpdate', context);
              if (onSelectionUpdate) {
                  this.editor.on('selectionUpdate', onSelectionUpdate);
              }
              const onTransaction = getExtensionField(extension, 'onTransaction', context);
              if (onTransaction) {
                  this.editor.on('transaction', onTransaction);
              }
              const onFocus = getExtensionField(extension, 'onFocus', context);
              if (onFocus) {
                  this.editor.on('focus', onFocus);
              }
              const onBlur = getExtensionField(extension, 'onBlur', context);
              if (onBlur) {
                  this.editor.on('blur', onBlur);
              }
              const onDestroy = getExtensionField(extension, 'onDestroy', context);
              if (onDestroy) {
                  this.editor.on('destroy', onDestroy);
              }
          });
      }
      static resolve(extensions) {
          const resolvedExtensions = ExtensionManager.sort(ExtensionManager.flatten(extensions));
          const duplicatedNames = findDuplicates(resolvedExtensions.map(extension => extension.name));
          if (duplicatedNames.length) {
              console.warn(`[tiptap warn]: Duplicate extension names found: [${duplicatedNames.map(item => `'${item}'`).join(', ')}]. This can lead to issues.`);
          }
          return resolvedExtensions;
      }
      static flatten(extensions) {
          return extensions
              .map(extension => {
              const context = {
                  name: extension.name,
                  options: extension.options,
                  storage: extension.storage,
              };
              const addExtensions = getExtensionField(extension, 'addExtensions', context);
              if (addExtensions) {
                  return [
                      extension,
                      ...this.flatten(addExtensions()),
                  ];
              }
              return extension;
          })
              .flat(10);
      }
      static sort(extensions) {
          const defaultPriority = 100;
          return extensions.sort((a, b) => {
              const priorityA = getExtensionField(a, 'priority') || defaultPriority;
              const priorityB = getExtensionField(b, 'priority') || defaultPriority;
              if (priorityA > priorityB) {
                  return -1;
              }
              if (priorityA < priorityB) {
                  return 1;
              }
              return 0;
          });
      }
      get commands() {
          return this.extensions.reduce((commands, extension) => {
              const context = {
                  name: extension.name,
                  options: extension.options,
                  storage: extension.storage,
                  editor: this.editor,
                  type: getSchemaTypeByName(extension.name, this.schema),
              };
              const addCommands = getExtensionField(extension, 'addCommands', context);
              if (!addCommands) {
                  return commands;
              }
              return {
                  ...commands,
                  ...addCommands(),
              };
          }, {});
      }
      get plugins() {
          const { editor } = this;
          const extensions = ExtensionManager.sort([...this.extensions].reverse());
          const inputRules = [];
          const pasteRules = [];
          const allPlugins = extensions
              .map(extension => {
              const context = {
                  name: extension.name,
                  options: extension.options,
                  storage: extension.storage,
                  editor,
                  type: getSchemaTypeByName(extension.name, this.schema),
              };
              const plugins = [];
              const addKeyboardShortcuts = getExtensionField(extension, 'addKeyboardShortcuts', context);
              if (addKeyboardShortcuts) {
                  const bindings = Object.fromEntries(Object
                      .entries(addKeyboardShortcuts())
                      .map(([shortcut, method]) => {
                      return [shortcut, () => method({ editor })];
                  }));
                  const keyMapPlugin = keymap(bindings);
                  plugins.push(keyMapPlugin);
              }
              const addInputRules = getExtensionField(extension, 'addInputRules', context);
              if (isExtensionRulesEnabled(extension, editor.options.enableInputRules) && addInputRules) {
                  inputRules.push(...addInputRules());
              }
              const addPasteRules = getExtensionField(extension, 'addPasteRules', context);
              if (isExtensionRulesEnabled(extension, editor.options.enablePasteRules) && addPasteRules) {
                  pasteRules.push(...addPasteRules());
              }
              const addProseMirrorPlugins = getExtensionField(extension, 'addProseMirrorPlugins', context);
              if (addProseMirrorPlugins) {
                  const proseMirrorPlugins = addProseMirrorPlugins();
                  plugins.push(...proseMirrorPlugins);
              }
              return plugins;
          })
              .flat();
          return [
              inputRulesPlugin({
                  editor,
                  rules: inputRules,
              }),
              ...pasteRulesPlugin({
                  editor,
                  rules: pasteRules,
              }),
              ...allPlugins,
          ];
      }
      get attributes() {
          return getAttributesFromExtensions(this.extensions);
      }
      get nodeViews() {
          const { editor } = this;
          const { nodeExtensions } = splitExtensions(this.extensions);
          return Object.fromEntries(nodeExtensions
              .filter(extension => !!getExtensionField(extension, 'addNodeView'))
              .map(extension => {
              const extensionAttributes = this.attributes.filter(attribute => attribute.type === extension.name);
              const context = {
                  name: extension.name,
                  options: extension.options,
                  storage: extension.storage,
                  editor,
                  type: getNodeType(extension.name, this.schema),
              };
              const addNodeView = getExtensionField(extension, 'addNodeView', context);
              if (!addNodeView) {
                  return [];
              }
              const nodeview = (node, view, getPos, decorations) => {
                  const HTMLAttributes = getRenderedAttributes(node, extensionAttributes);
                  return addNodeView()({
                      editor,
                      node,
                      getPos,
                      decorations,
                      HTMLAttributes,
                      extension,
                  });
              };
              return [extension.name, nodeview];
          }));
      }
  }
  class EventEmitter {
      constructor() {
          this.callbacks = {};
      }
      on(event, fn) {
          if (!this.callbacks[event]) {
              this.callbacks[event] = [];
          }
          this.callbacks[event].push(fn);
          return this;
      }
      emit(event, ...args) {
          const callbacks = this.callbacks[event];
          if (callbacks) {
              callbacks.forEach(callback => callback.apply(this, args));
          }
          return this;
      }
      off(event, fn) {
          const callbacks = this.callbacks[event];
          if (callbacks) {
              if (fn) {
                  this.callbacks[event] = callbacks.filter(callback => callback !== fn);
              }
              else {
                  delete this.callbacks[event];
              }
          }
          return this;
      }
      removeAllListeners() {
          this.callbacks = {};
      }
  }
  const style = `.ProseMirror {
  position: relative;
}

.ProseMirror {
  word-wrap: break-word;
  white-space: pre-wrap;
  white-space: break-spaces;
  -webkit-font-variant-ligatures: none;
  font-variant-ligatures: none;
  font-feature-settings: "liga" 0; /* the above doesn't seem to work in Edge */
}

.ProseMirror [contenteditable="false"] {
  white-space: normal;
}

.ProseMirror [contenteditable="false"] [contenteditable="true"] {
  white-space: pre-wrap;
}

.ProseMirror pre {
  white-space: pre-wrap;
}

img.ProseMirror-separator {
  display: inline !important;
  border: none !important;
  margin: 0 !important;
  width: 1px !important;
  height: 1px !important;
}

.ProseMirror-gapcursor {
  display: none;
  pointer-events: none;
  position: absolute;
  margin: 0;
}

.ProseMirror-gapcursor:after {
  content: "";
  display: block;
  position: absolute;
  top: -2px;
  width: 20px;
  border-top: 1px solid black;
  animation: ProseMirror-cursor-blink 1.1s steps(2, start) infinite;
}

@keyframes ProseMirror-cursor-blink {
  to {
    visibility: hidden;
  }
}

.ProseMirror-hideselection *::selection {
  background: transparent;
}

.ProseMirror-hideselection *::-moz-selection {
  background: transparent;
}

.ProseMirror-hideselection * {
  caret-color: transparent;
}

.ProseMirror-focused .ProseMirror-gapcursor {
  display: block;
}

.tippy-box[data-animation=fade][data-state=hidden] {
  opacity: 0
}`;
  class Editor extends EventEmitter {
      constructor(options = {}) {
          super();
          this.isFocused = false;
          this.extensionStorage = {};
          this.options = {
              element: document.createElement('div'),
              content: '',
              injectCSS: true,
              extensions: [],
              autofocus: false,
              editable: true,
              editorProps: {},
              parseOptions: {},
              enableInputRules: true,
              enablePasteRules: true,
              enableCoreExtensions: true,
              onBeforeCreate: () => null,
              onCreate: () => null,
              onUpdate: () => null,
              onSelectionUpdate: () => null,
              onTransaction: () => null,
              onFocus: () => null,
              onBlur: () => null,
              onDestroy: () => null,
          };
          this.isCapturingTransaction = false;
          this.capturedTransaction = null;
          this.setOptions(options);
          this.createExtensionManager();
          this.createCommandManager();
          this.createSchema();
          this.on('beforeCreate', this.options.onBeforeCreate);
          this.emit('beforeCreate', { editor: this });
          this.createView();
          this.injectCSS();
          this.on('create', this.options.onCreate);
          this.on('update', this.options.onUpdate);
          this.on('selectionUpdate', this.options.onSelectionUpdate);
          this.on('transaction', this.options.onTransaction);
          this.on('focus', this.options.onFocus);
          this.on('blur', this.options.onBlur);
          this.on('destroy', this.options.onDestroy);
          window.setTimeout(() => {
              if (this.isDestroyed) {
                  return;
              }
              this.commands.focus(this.options.autofocus);
              this.emit('create', { editor: this });
          }, 0);
      }
      get storage() {
          return this.extensionStorage;
      }
      get commands() {
          return this.commandManager.commands;
      }
      chain() {
          return this.commandManager.chain();
      }
      can() {
          return this.commandManager.can();
      }
      injectCSS() {
          if (this.options.injectCSS && document) {
              this.css = createStyleTag(style);
          }
      }
      setOptions(options = {}) {
          this.options = {
              ...this.options,
              ...options,
          };
          if (!this.view || !this.state || this.isDestroyed) {
              return;
          }
          if (this.options.editorProps) {
              this.view.setProps(this.options.editorProps);
          }
          this.view.updateState(this.state);
      }
      setEditable(editable) {
          this.setOptions({ editable });
      }
      get isEditable() {
          return this.options.editable
              && this.view
              && this.view.editable;
      }
      get state() {
          return this.view.state;
      }
      registerPlugin(plugin, handlePlugins) {
          const plugins = isFunction(handlePlugins)
              ? handlePlugins(plugin, this.state.plugins)
              : [...this.state.plugins, plugin];
          const state = this.state.reconfigure({ plugins });
          this.view.updateState(state);
      }
      unregisterPlugin(nameOrPluginKey) {
          if (this.isDestroyed) {
              return;
          }
          const name = typeof nameOrPluginKey === 'string'
              ? `${nameOrPluginKey}$`
              : nameOrPluginKey.key;
          const state = this.state.reconfigure({
              plugins: this.state.plugins.filter(plugin => !plugin.key.startsWith(name)),
          });
          this.view.updateState(state);
      }
      createExtensionManager() {
          const coreExtensions = this.options.enableCoreExtensions
              ? Object.values(extensions)
              : [];
          const allExtensions = [...coreExtensions, ...this.options.extensions].filter(extension => {
              return ['extension', 'node', 'mark'].includes(extension === null || extension === void 0 ? void 0 : extension.type);
          });
          this.extensionManager = new ExtensionManager(allExtensions, this);
      }
      createCommandManager() {
          this.commandManager = new CommandManager({
              editor: this,
          });
      }
      createSchema() {
          this.schema = this.extensionManager.schema;
      }
      createView() {
          const doc = createDocument(this.options.content, this.schema, this.options.parseOptions);
          const selection = resolveFocusPosition(doc, this.options.autofocus);
          this.view = new EditorView(this.options.element, {
              ...this.options.editorProps,
              dispatchTransaction: this.dispatchTransaction.bind(this),
              state: EditorState.create({
                  doc,
                  selection,
              }),
          });
          const newState = this.state.reconfigure({
              plugins: this.extensionManager.plugins,
          });
          this.view.updateState(newState);
          this.createNodeViews();
          const dom = this.view.dom;
          dom.editor = this;
      }
      createNodeViews() {
          this.view.setProps({
              nodeViews: this.extensionManager.nodeViews,
          });
      }
      captureTransaction(fn) {
          this.isCapturingTransaction = true;
          fn();
          this.isCapturingTransaction = false;
          const tr = this.capturedTransaction;
          this.capturedTransaction = null;
          return tr;
      }
      dispatchTransaction(transaction) {
          if (this.isCapturingTransaction) {
              if (!this.capturedTransaction) {
                  this.capturedTransaction = transaction;
                  return;
              }
              transaction.steps.forEach(step => { var _a; return (_a = this.capturedTransaction) === null || _a === void 0 ? void 0 : _a.step(step); });
              return;
          }
          const state = this.state.apply(transaction);
          const selectionHasChanged = !this.state.selection.eq(state.selection);
          this.view.updateState(state);
          this.emit('transaction', {
              editor: this,
              transaction,
          });
          if (selectionHasChanged) {
              this.emit('selectionUpdate', {
                  editor: this,
                  transaction,
              });
          }
          const focus = transaction.getMeta('focus');
          const blur = transaction.getMeta('blur');
          if (focus) {
              this.emit('focus', {
                  editor: this,
                  event: focus.event,
                  transaction,
              });
          }
          if (blur) {
              this.emit('blur', {
                  editor: this,
                  event: blur.event,
                  transaction,
              });
          }
          if (!transaction.docChanged || transaction.getMeta('preventUpdate')) {
              return;
          }
          this.emit('update', {
              editor: this,
              transaction,
          });
      }
      getAttributes(nameOrType) {
          return getAttributes(this.state, nameOrType);
      }
      isActive(nameOrAttributes, attributesOrUndefined) {
          const name = typeof nameOrAttributes === 'string'
              ? nameOrAttributes
              : null;
          const attributes = typeof nameOrAttributes === 'string'
              ? attributesOrUndefined
              : nameOrAttributes;
          return isActive(this.state, name, attributes);
      }
      getJSON() {
          return this.state.doc.toJSON();
      }
      getHTML() {
          return getHTMLFromFragment(this.state.doc.content, this.schema);
      }
      getText(options) {
          const { blockSeparator = '\n\n', textSerializers = {}, } = options || {};
          return getText(this.state.doc, {
              blockSeparator,
              textSerializers: {
                  ...textSerializers,
                  ...getTextSeralizersFromSchema(this.schema),
              },
          });
      }
      get isEmpty() {
          return isNodeEmpty(this.state.doc);
      }
      getCharacterCount() {
          console.warn('[tiptap warn]: "editor.getCharacterCount()" is deprecated. Please use "editor.storage.characterCount.characters()" instead.');
          return this.state.doc.content.size - 2;
      }
      destroy() {
          this.emit('destroy');
          if (this.view) {
              this.view.destroy();
          }
          this.removeAllListeners();
      }
      get isDestroyed() {
          var _a;
          return !((_a = this.view) === null || _a === void 0 ? void 0 : _a.docView);
      }
  }
  class Node {
      constructor(config = {}) {
          this.type = 'node';
          this.name = 'node';
          this.parent = null;
          this.child = null;
          this.config = {
              name: this.name,
              defaultOptions: {},
          };
          this.config = {
              ...this.config,
              ...config,
          };
          this.name = this.config.name;
          if (config.defaultOptions) {
              console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`);
          }
          this.options = this.config.defaultOptions;
          if (this.config.addOptions) {
              this.options = callOrReturn(getExtensionField(this, 'addOptions', {
                  name: this.name,
              }));
          }
          this.storage = callOrReturn(getExtensionField(this, 'addStorage', {
              name: this.name,
              options: this.options,
          })) || {};
      }
      static create(config = {}) {
          return new Node(config);
      }
      configure(options = {}) {
          const extension = this.extend();
          extension.options = mergeDeep(this.options, options);
          extension.storage = callOrReturn(getExtensionField(extension, 'addStorage', {
              name: extension.name,
              options: extension.options,
          }));
          return extension;
      }
      extend(extendedConfig = {}) {
          const extension = new Node(extendedConfig);
          extension.parent = this;
          this.child = extension;
          extension.name = extendedConfig.name
              ? extendedConfig.name
              : extension.parent.name;
          if (extendedConfig.defaultOptions) {
              console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${extension.name}".`);
          }
          extension.options = callOrReturn(getExtensionField(extension, 'addOptions', {
              name: extension.name,
          }));
          extension.storage = callOrReturn(getExtensionField(extension, 'addStorage', {
              name: extension.name,
              options: extension.options,
          }));
          return extension;
      }
  }
  class Mark {
      constructor(config = {}) {
          this.type = 'mark';
          this.name = 'mark';
          this.parent = null;
          this.child = null;
          this.config = {
              name: this.name,
              defaultOptions: {},
          };
          this.config = {
              ...this.config,
              ...config,
          };
          this.name = this.config.name;
          if (config.defaultOptions) {
              console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`);
          }
          this.options = this.config.defaultOptions;
          if (this.config.addOptions) {
              this.options = callOrReturn(getExtensionField(this, 'addOptions', {
                  name: this.name,
              }));
          }
          this.storage = callOrReturn(getExtensionField(this, 'addStorage', {
              name: this.name,
              options: this.options,
          })) || {};
      }
      static create(config = {}) {
          return new Mark(config);
      }
      configure(options = {}) {
          const extension = this.extend();
          extension.options = mergeDeep(this.options, options);
          extension.storage = callOrReturn(getExtensionField(extension, 'addStorage', {
              name: extension.name,
              options: extension.options,
          }));
          return extension;
      }
      extend(extendedConfig = {}) {
          const extension = new Mark(extendedConfig);
          extension.parent = this;
          this.child = extension;
          extension.name = extendedConfig.name
              ? extendedConfig.name
              : extension.parent.name;
          if (extendedConfig.defaultOptions) {
              console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${extension.name}".`);
          }
          extension.options = callOrReturn(getExtensionField(extension, 'addOptions', {
              name: extension.name,
          }));
          extension.storage = callOrReturn(getExtensionField(extension, 'addStorage', {
              name: extension.name,
              options: extension.options,
          }));
          return extension;
      }
  }
  class NodeView {
      constructor(component, props, options) {
          this.isDragging = false;
          this.component = component;
          this.editor = props.editor;
          this.options = {
              stopEvent: null,
              ignoreMutation: null,
              ...options,
          };
          this.extension = props.extension;
          this.node = props.node;
          this.decorations = props.decorations;
          this.getPos = props.getPos;
          this.mount();
      }
      mount() {
          return;
      }
      get dom() {
          return null;
      }
      get contentDOM() {
          return null;
      }
      onDragStart(event) {
          var _a, _b, _c;
          const { view } = this.editor;
          const target = event.target;
          const dragHandle = target.nodeType === 3
              ? (_a = target.parentElement) === null || _a === void 0 ? void 0 : _a.closest('[data-drag-handle]')
              : target.closest('[data-drag-handle]');
          if (!this.dom
              || ((_b = this.contentDOM) === null || _b === void 0 ? void 0 : _b.contains(target))
              || !dragHandle) {
              return;
          }
          let x = 0;
          let y = 0;
          if (this.dom !== dragHandle) {
              const domBox = this.dom.getBoundingClientRect();
              const handleBox = dragHandle.getBoundingClientRect();
              x = handleBox.x - domBox.x + event.offsetX;
              y = handleBox.y - domBox.y + event.offsetY;
          }
          (_c = event.dataTransfer) === null || _c === void 0 ? void 0 : _c.setDragImage(this.dom, x, y);
          const selection = NodeSelection.create(view.state.doc, this.getPos());
          const transaction = view.state.tr.setSelection(selection);
          view.dispatch(transaction);
      }
      stopEvent(event) {
          var _a;
          if (!this.dom) {
              return false;
          }
          if (typeof this.options.stopEvent === 'function') {
              return this.options.stopEvent({ event });
          }
          const target = event.target;
          const isInElement = this.dom.contains(target) && !((_a = this.contentDOM) === null || _a === void 0 ? void 0 : _a.contains(target));
          if (!isInElement) {
              return false;
          }
          const isDropEvent = event.type === 'drop';
          const isInput = ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(target.tagName)
              || target.isContentEditable;
          if (isInput && !isDropEvent) {
              return true;
          }
          const { isEditable } = this.editor;
          const { isDragging } = this;
          const isDraggable = !!this.node.type.spec.draggable;
          const isSelectable = NodeSelection.isSelectable(this.node);
          const isCopyEvent = event.type === 'copy';
          const isPasteEvent = event.type === 'paste';
          const isCutEvent = event.type === 'cut';
          const isClickEvent = event.type === 'mousedown';
          const isDragEvent = event.type.startsWith('drag');
          if (!isDraggable && isSelectable && isDragEvent) {
              event.preventDefault();
          }
          if (isDraggable && isDragEvent && !isDragging) {
              event.preventDefault();
              return false;
          }
          if (isDraggable && isEditable && !isDragging && isClickEvent) {
              const dragHandle = target.closest('[data-drag-handle]');
              const isValidDragHandle = dragHandle
                  && (this.dom === dragHandle || (this.dom.contains(dragHandle)));
              if (isValidDragHandle) {
                  this.isDragging = true;
                  document.addEventListener('dragend', () => {
                      this.isDragging = false;
                  }, { once: true });
                  document.addEventListener('mouseup', () => {
                      this.isDragging = false;
                  }, { once: true });
              }
          }
          if (isDragging
              || isDropEvent
              || isCopyEvent
              || isPasteEvent
              || isCutEvent
              || (isClickEvent && isSelectable)) {
              return false;
          }
          return true;
      }
      ignoreMutation(mutation) {
          if (!this.dom || !this.contentDOM) {
              return true;
          }
          if (typeof this.options.ignoreMutation === 'function') {
              return this.options.ignoreMutation({ mutation });
          }
          if (this.node.isLeaf || this.node.isAtom) {
              return true;
          }
          if (mutation.type === 'selection') {
              return false;
          }
          if (this.dom.contains(mutation.target)
              && mutation.type === 'childList'
              && isiOS()
              && this.editor.isFocused) {
              const changedNodes = [
                  ...Array.from(mutation.addedNodes),
                  ...Array.from(mutation.removedNodes),
              ];
              if (changedNodes.every(node => node.isContentEditable)) {
                  return false;
              }
          }
          if (this.contentDOM === mutation.target && mutation.type === 'attributes') {
              return true;
          }
          if (this.contentDOM.contains(mutation.target)) {
              return false;
          }
          return true;
      }
      updateAttributes(attributes) {
          this.editor.commands.command(({ tr }) => {
              const pos = this.getPos();
              tr.setNodeMarkup(pos, undefined, {
                  ...this.node.attrs,
                  ...attributes,
              });
              return true;
          });
      }
      deleteNode() {
          const from = this.getPos();
          const to = from + this.node.nodeSize;
          this.editor.commands.deleteRange({ from, to });
      }
  }
  class Tracker {
      constructor(transaction) {
          this.transaction = transaction;
          this.currentStep = this.transaction.steps.length;
      }
      map(position) {
          let deleted = false;
          const mappedPosition = this.transaction.steps
              .slice(this.currentStep)
              .reduce((newPosition, step) => {
              const mapResult = step
                  .getMap()
                  .mapResult(newPosition);
              if (mapResult.deleted) {
                  deleted = true;
              }
              return mapResult.pos;
          }, position);
          return {
              position: mappedPosition,
              deleted,
          };
      }
  }
  function nodeInputRule(config) {
      return new InputRule({
          find: config.find,
          handler: ({ state, range, match }) => {
              const attributes = callOrReturn(config.getAttributes, undefined, match) || {};
              const { tr } = state;
              const start = range.from;
              let end = range.to;
              if (match[1]) {
                  const offset = match[0].lastIndexOf(match[1]);
                  let matchStart = start + offset;
                  if (matchStart > end) {
                      matchStart = end;
                  }
                  else {
                      end = matchStart + match[1].length;
                  }
                  const lastChar = match[0][match[0].length - 1];
                  tr.insertText(lastChar, start + match[0].length - 1);
                  tr.replaceWith(matchStart, end, config.type.create(attributes));
              }
              else if (match[0]) {
                  tr.replaceWith(start, end, config.type.create(attributes));
              }
          },
      });
  }
  function getMarksBetween(from, to, doc) {
      const marks = [];
      if (from === to) {
          doc
              .resolve(from)
              .marks()
              .forEach(mark => {
              const $pos = doc.resolve(from - 1);
              const range = getMarkRange($pos, mark.type);
              if (!range) {
                  return;
              }
              marks.push({
                  mark,
                  ...range,
              });
          });
      }
      else {
          doc.nodesBetween(from, to, (node, pos) => {
              marks.push(...node.marks.map(mark => ({
                  from: pos,
                  to: pos + node.nodeSize,
                  mark,
              })));
          });
      }
      return marks;
  }
  function markInputRule(config) {
      return new InputRule({
          find: config.find,
          handler: ({ state, range, match }) => {
              const attributes = callOrReturn(config.getAttributes, undefined, match);
              if (attributes === false || attributes === null) {
                  return null;
              }
              const { tr } = state;
              const captureGroup = match[match.length - 1];
              const fullMatch = match[0];
              let markEnd = range.to;
              if (captureGroup) {
                  const startSpaces = fullMatch.search(/\S/);
                  const textStart = range.from + fullMatch.indexOf(captureGroup);
                  const textEnd = textStart + captureGroup.length;
                  const excludedMarks = getMarksBetween(range.from, range.to, state.doc)
                      .filter(item => {
                      const excluded = item.mark.type.excluded;
                      return excluded.find(type => type === config.type && type !== item.mark.type);
                  })
                      .filter(item => item.to > textStart);
                  if (excludedMarks.length) {
                      return null;
                  }
                  if (textEnd < range.to) {
                      tr.delete(textEnd, range.to);
                  }
                  if (textStart > range.from) {
                      tr.delete(range.from + startSpaces, textStart);
                  }
                  markEnd = range.from + startSpaces + captureGroup.length;
                  tr.addMark(range.from + startSpaces, markEnd, config.type.create(attributes || {}));
                  tr.removeStoredMark(config.type);
              }
          },
      });
  }
  function textblockTypeInputRule(config) {
      return new InputRule({
          find: config.find,
          handler: ({ state, range, match }) => {
              const $start = state.doc.resolve(range.from);
              const attributes = callOrReturn(config.getAttributes, undefined, match) || {};
              if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), config.type)) {
                  return null;
              }
              state.tr
                  .delete(range.from, range.to)
                  .setBlockType(range.from, range.from, config.type, attributes);
          },
      });
  }
  function textInputRule(config) {
      return new InputRule({
          find: config.find,
          handler: ({ state, range, match }) => {
              let insert = config.replace;
              let start = range.from;
              const end = range.to;
              if (match[1]) {
                  const offset = match[0].lastIndexOf(match[1]);
                  insert += match[0].slice(offset + match[1].length);
                  start += offset;
                  const cutOff = start - end;
                  if (cutOff > 0) {
                      insert = match[0].slice(offset - cutOff, offset) + insert;
                      start = end;
                  }
              }
              state.tr.insertText(insert, start, end);
          },
      });
  }
  function wrappingInputRule(config) {
      return new InputRule({
          find: config.find,
          handler: ({ state, range, match }) => {
              const attributes = callOrReturn(config.getAttributes, undefined, match) || {};
              const tr = state.tr.delete(range.from, range.to);
              const $start = tr.doc.resolve(range.from);
              const blockRange = $start.blockRange();
              const wrapping = blockRange && findWrapping(blockRange, config.type, attributes);
              if (!wrapping) {
                  return null;
              }
              tr.wrap(blockRange, wrapping);
              const before = tr.doc.resolve(range.from - 1).nodeBefore;
              if (before
                  && before.type === config.type
                  && canJoin(tr.doc, range.from - 1)
                  && (!config.joinPredicate || config.joinPredicate(match, before))) {
                  tr.join(range.from - 1);
              }
          },
      });
  }
  function markPasteRule(config) {
      return new PasteRule({
          find: config.find,
          handler: ({ state, range, match }) => {
              const attributes = callOrReturn(config.getAttributes, undefined, match);
              if (attributes === false || attributes === null) {
                  return null;
              }
              const { tr } = state;
              const captureGroup = match[match.length - 1];
              const fullMatch = match[0];
              let markEnd = range.to;
              if (captureGroup) {
                  const startSpaces = fullMatch.search(/\S/);
                  const textStart = range.from + fullMatch.indexOf(captureGroup);
                  const textEnd = textStart + captureGroup.length;
                  const excludedMarks = getMarksBetween(range.from, range.to, state.doc)
                      .filter(item => {
                      const excluded = item.mark.type.excluded;
                      return excluded.find(type => type === config.type && type !== item.mark.type);
                  })
                      .filter(item => item.to > textStart);
                  if (excludedMarks.length) {
                      return null;
                  }
                  if (textEnd < range.to) {
                      tr.delete(textEnd, range.to);
                  }
                  if (textStart > range.from) {
                      tr.delete(range.from + startSpaces, textStart);
                  }
                  markEnd = range.from + startSpaces + captureGroup.length;
                  tr.addMark(range.from + startSpaces, markEnd, config.type.create(attributes || {}));
                  tr.removeStoredMark(config.type);
              }
          },
      });
  }
  function textPasteRule(config) {
      return new PasteRule({
          find: config.find,
          handler: ({ state, range, match }) => {
              let insert = config.replace;
              let start = range.from;
              const end = range.to;
              if (match[1]) {
                  const offset = match[0].lastIndexOf(match[1]);
                  insert += match[0].slice(offset + match[1].length);
                  start += offset;
                  const cutOff = start - end;
                  if (cutOff > 0) {
                      insert = match[0].slice(offset - cutOff, offset) + insert;
                      start = end;
                  }
              }
              state.tr.insertText(insert, start, end);
          },
      });
  }
  function escapeForRegEx(string) {
      return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  }
  function combineTransactionSteps(oldDoc, transactions) {
      const transform = new Transform(oldDoc);
      transactions.forEach(transaction => {
          transaction.steps.forEach(step => {
              transform.step(step);
          });
      });
      return transform;
  }
  function defaultBlockAt(match) {
      for (let i = 0; i < match.edgeCount; i += 1) {
          const { type } = match.edge(i);
          if (type.isTextblock && !type.hasRequiredAttrs()) {
              return type;
          }
      }
      return null;
  }
  function findChildren(node, predicate) {
      const nodesWithPos = [];
      node.descendants((child, pos) => {
          if (predicate(child)) {
              nodesWithPos.push({
                  node: child,
                  pos,
              });
          }
      });
      return nodesWithPos;
  }
  function findChildrenInRange(node, range, predicate) {
      const nodesWithPos = [];
      node.nodesBetween(range.from, range.to, (child, pos) => {
          if (predicate(child)) {
              nodesWithPos.push({
                  node: child,
                  pos,
              });
          }
      });
      return nodesWithPos;
  }
  function getSchema(extensions) {
      const resolvedExtensions = ExtensionManager.resolve(extensions);
      return getSchemaByResolvedExtensions(resolvedExtensions);
  }
  function generateHTML(doc, extensions) {
      const schema = getSchema(extensions);
      const contentNode = Node$1.fromJSON(schema, doc);
      return getHTMLFromFragment(contentNode.content, schema);
  }
  function generateJSON(html, extensions) {
      const schema = getSchema(extensions);
      const dom = elementFromString(html);
      return DOMParser.fromSchema(schema)
          .parse(dom)
          .toJSON();
  }
  function generateText(doc, extensions, options) {
      const { blockSeparator = '\n\n', textSerializers = {}, } = options || {};
      const schema = getSchema(extensions);
      const contentNode = Node$1.fromJSON(schema, doc);
      return getText(contentNode, {
          blockSeparator,
          textSerializers: {
              ...textSerializers,
              ...getTextSeralizersFromSchema(schema),
          },
      });
  }
  function removeDuplicates(array, by = JSON.stringify) {
      const seen = {};
      return array.filter(item => {
          const key = by(item);
          return Object.prototype.hasOwnProperty.call(seen, key)
              ? false
              : (seen[key] = true);
      });
  }
  function simplifyChangedRanges(changes) {
      const uniqueChanges = removeDuplicates(changes);
      return uniqueChanges.length === 1
          ? uniqueChanges
          : uniqueChanges.filter((change, index) => {
              const rest = uniqueChanges.filter((_, i) => i !== index);
              return !rest.some(otherChange => {
                  return change.oldRange.from >= otherChange.oldRange.from
                      && change.oldRange.to <= otherChange.oldRange.to
                      && change.newRange.from >= otherChange.newRange.from
                      && change.newRange.to <= otherChange.newRange.to;
              });
          });
  }
  function getChangedRanges(transform) {
      const { mapping, steps } = transform;
      const changes = [];
      mapping.maps.forEach((stepMap, index) => {
          const ranges = [];
          if (!stepMap.ranges.length) {
              const { from, to } = steps[index];
              if (from === undefined || to === undefined) {
                  return;
              }
              ranges.push({ from, to });
          }
          else {
              stepMap.forEach((from, to) => {
                  ranges.push({ from, to });
              });
          }
          ranges.forEach(({ from, to }) => {
              const newStart = mapping.slice(index).map(from, -1);
              const newEnd = mapping.slice(index).map(to);
              const oldStart = mapping.invert().map(newStart, -1);
              const oldEnd = mapping.invert().map(newEnd);
              changes.push({
                  oldRange: {
                      from: oldStart,
                      to: oldEnd,
                  },
                  newRange: {
                      from: newStart,
                      to: newEnd,
                  },
              });
          });
      });
      return simplifyChangedRanges(changes);
  }
  function getDebugJSON(node, startOffset = 0) {
      const isTopNode = node.type === node.type.schema.topNodeType;
      const increment = isTopNode ? 0 : 1;
      const from = startOffset;
      const to = from + node.nodeSize;
      const marks = node.marks.map(mark => {
          const output = {
              type: mark.type.name,
          };
          if (Object.keys(mark.attrs).length) {
              output.attrs = { ...mark.attrs };
          }
          return output;
      });
      const attrs = { ...node.attrs };
      const output = {
          type: node.type.name,
          from,
          to,
      };
      if (Object.keys(attrs).length) {
          output.attrs = attrs;
      }
      if (marks.length) {
          output.marks = marks;
      }
      if (node.content.childCount) {
          output.content = [];
          node.forEach((child, offset) => {
              var _a;
              (_a = output.content) === null || _a === void 0 ? void 0 : _a.push(getDebugJSON(child, startOffset + offset + increment));
          });
      }
      if (node.text) {
          output.text = node.text;
      }
      return output;
  }
  function isNodeSelection(value) {
      return isObject(value) && value instanceof NodeSelection;
  }
  function posToDOMRect(view, from, to) {
      const minPos = 0;
      const maxPos = view.state.doc.content.size;
      const resolvedFrom = minMax(from, minPos, maxPos);
      const resolvedEnd = minMax(to, minPos, maxPos);
      const start = view.coordsAtPos(resolvedFrom);
      const end = view.coordsAtPos(resolvedEnd, -1);
      const top = Math.min(start.top, end.top);
      const bottom = Math.max(start.bottom, end.bottom);
      const left = Math.min(start.left, end.left);
      const right = Math.max(start.right, end.right);
      const width = right - left;
      const height = bottom - top;
      const x = left;
      const y = top;
      const data = {
          top,
          bottom,
          left,
          right,
          width,
          height,
          x,
          y,
      };
      return {
          ...data,
          toJSON: () => data,
      };
  }

  const Document = Node.create({
      name: 'doc',
      topNode: true,
      content: 'block+',
  });

  const Paragraph = Node.create({
      name: 'paragraph',
      priority: 1000,
      addOptions() {
          return {
              HTMLAttributes: {},
          };
      },
      group: 'block',
      content: 'inline*',
      parseHTML() {
          return [
              { tag: 'p' },
          ];
      },
      renderHTML({ HTMLAttributes }) {
          return ['p', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
      },
      addCommands() {
          return {
              setParagraph: () => ({ commands }) => {
                  return commands.setNode(this.name);
              },
          };
      },
      addKeyboardShortcuts() {
          return {
              'Mod-Alt-0': () => this.editor.commands.setParagraph(),
          };
      },
  });

  const Text$1 = Node.create({
      name: 'text',
      group: 'inline',
  });

  const Underline = Mark.create({
      name: 'underline',
      addOptions() {
          return {
              HTMLAttributes: {},
          };
      },
      parseHTML() {
          return [
              {
                  tag: 'u',
              },
              {
                  style: 'text-decoration',
                  consuming: false,
                  getAttrs: style => (style.includes('underline') ? {} : false),
              },
          ];
      },
      renderHTML({ HTMLAttributes }) {
          return ['u', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
      },
      addCommands() {
          return {
              setUnderline: () => ({ commands }) => {
                  return commands.setMark(this.name);
              },
              toggleUnderline: () => ({ commands }) => {
                  return commands.toggleMark(this.name);
              },
              unsetUnderline: () => ({ commands }) => {
                  return commands.unsetMark(this.name);
              },
          };
      },
      addKeyboardShortcuts() {
          return {
              'Mod-u': () => this.editor.commands.toggleUnderline(),
              'Mod-U': () => this.editor.commands.toggleUnderline(),
          };
      },
  });

  const TextStyle = Mark.create({
      name: 'textStyle',
      addOptions() {
          return {
              HTMLAttributes: {},
          };
      },
      parseHTML() {
          return [
              {
                  tag: 'span',
                  getAttrs: element => {
                      const hasStyles = element.hasAttribute('style');
                      if (!hasStyles) {
                          return false;
                      }
                      return {};
                  },
              },
          ];
      },
      renderHTML({ HTMLAttributes }) {
          return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
      },
      addCommands() {
          return {
              removeEmptyTextStyle: () => ({ state, commands }) => {
                  const attributes = getMarkAttributes(state, this.type);
                  const hasStyles = Object.entries(attributes).some(([, value]) => !!value);
                  if (hasStyles) {
                      return true;
                  }
                  return commands.unsetMark(this.name);
              },
          };
      },
  });

  const Color = Extension.create({
      name: 'color',
      addOptions() {
          return {
              types: ['textStyle'],
          };
      },
      addGlobalAttributes() {
          return [
              {
                  types: this.options.types,
                  attributes: {
                      color: {
                          default: null,
                          parseHTML: element => element.style.color.replace(/['"]+/g, ''),
                          renderHTML: attributes => {
                              if (!attributes.color) {
                                  return {};
                              }
                              return {
                                  style: `color: ${attributes.color}`,
                              };
                          },
                      },
                  },
              },
          ];
      },
      addCommands() {
          return {
              setColor: color => ({ chain }) => {
                  return chain()
                      .setMark('textStyle', { color })
                      .run();
              },
              unsetColor: () => ({ chain }) => {
                  return chain()
                      .setMark('textStyle', { color: null })
                      .removeEmptyTextStyle()
                      .run();
              },
          };
      },
  });

  const Heading = Node.create({
      name: 'heading',
      addOptions() {
          return {
              levels: [1, 2, 3, 4, 5, 6],
              HTMLAttributes: {},
          };
      },
      content: 'inline*',
      group: 'block',
      defining: true,
      addAttributes() {
          return {
              level: {
                  default: 1,
                  rendered: false,
              },
          };
      },
      parseHTML() {
          return this.options.levels
              .map((level) => ({
              tag: `h${level}`,
              attrs: { level },
          }));
      },
      renderHTML({ node, HTMLAttributes }) {
          const hasLevel = this.options.levels.includes(node.attrs.level);
          const level = hasLevel
              ? node.attrs.level
              : this.options.levels[0];
          return [`h${level}`, mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
      },
      addCommands() {
          return {
              setHeading: attributes => ({ commands }) => {
                  if (!this.options.levels.includes(attributes.level)) {
                      return false;
                  }
                  return commands.setNode(this.name, attributes);
              },
              toggleHeading: attributes => ({ commands }) => {
                  if (!this.options.levels.includes(attributes.level)) {
                      return false;
                  }
                  return commands.toggleNode(this.name, 'paragraph', attributes);
              },
          };
      },
      addKeyboardShortcuts() {
          return this.options.levels.reduce((items, level) => ({
              ...items,
              ...{
                  [`Mod-Alt-${level}`]: () => this.editor.commands.toggleHeading({ level }),
              },
          }), {});
      },
      addInputRules() {
          return this.options.levels.map(level => {
              return textblockTypeInputRule({
                  find: new RegExp(`^(#{1,${level}})\\s$`),
                  type: this.type,
                  getAttributes: {
                      level,
                  },
              });
          });
      },
  });

  const inputRegex$4 = /^\s*([-+*])\s$/;
  const BulletList = Node.create({
      name: 'bulletList',
      addOptions() {
          return {
              itemTypeName: 'listItem',
              HTMLAttributes: {},
          };
      },
      group: 'block list',
      content() {
          return `${this.options.itemTypeName}+`;
      },
      parseHTML() {
          return [
              { tag: 'ul' },
          ];
      },
      renderHTML({ HTMLAttributes }) {
          return ['ul', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
      },
      addCommands() {
          return {
              toggleBulletList: () => ({ commands }) => {
                  return commands.toggleList(this.name, this.options.itemTypeName);
              },
          };
      },
      addKeyboardShortcuts() {
          return {
              'Mod-Shift-8': () => this.editor.commands.toggleBulletList(),
          };
      },
      addInputRules() {
          return [
              wrappingInputRule({
                  find: inputRegex$4,
                  type: this.type,
              }),
          ];
      },
  });

  const inputRegex$3 = /^(\d+)\.\s$/;
  const OrderedList = Node.create({
      name: 'orderedList',
      addOptions() {
          return {
              itemTypeName: 'listItem',
              HTMLAttributes: {},
          };
      },
      group: 'block list',
      content() {
          return `${this.options.itemTypeName}+`;
      },
      addAttributes() {
          return {
              start: {
                  default: 1,
                  parseHTML: element => {
                      return element.hasAttribute('start')
                          ? parseInt(element.getAttribute('start') || '', 10)
                          : 1;
                  },
              },
          };
      },
      parseHTML() {
          return [
              {
                  tag: 'ol',
              },
          ];
      },
      renderHTML({ HTMLAttributes }) {
          const { start, ...attributesWithoutStart } = HTMLAttributes;
          return start === 1
              ? ['ol', mergeAttributes(this.options.HTMLAttributes, attributesWithoutStart), 0]
              : ['ol', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
      },
      addCommands() {
          return {
              toggleOrderedList: () => ({ commands }) => {
                  return commands.toggleList(this.name, this.options.itemTypeName);
              },
          };
      },
      addKeyboardShortcuts() {
          return {
              'Mod-Shift-7': () => this.editor.commands.toggleOrderedList(),
          };
      },
      addInputRules() {
          return [
              wrappingInputRule({
                  find: inputRegex$3,
                  type: this.type,
                  getAttributes: match => ({ start: +match[1] }),
                  joinPredicate: (match, node) => node.childCount + node.attrs.start === +match[1],
              }),
          ];
      },
  });

  const ListItem = Node.create({
      name: 'listItem',
      addOptions() {
          return {
              HTMLAttributes: {},
          };
      },
      content: 'paragraph block*',
      defining: true,
      parseHTML() {
          return [
              {
                  tag: 'li',
              },
          ];
      },
      renderHTML({ HTMLAttributes }) {
          return ['li', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
      },
      addKeyboardShortcuts() {
          return {
              Enter: () => this.editor.commands.splitListItem(this.name),
              Tab: () => this.editor.commands.sinkListItem(this.name),
              'Shift-Tab': () => this.editor.commands.liftListItem(this.name),
          };
      },
  });

  const inputRegex$2 = /^\s*>\s$/;
  const Blockquote = Node.create({
      name: 'blockquote',
      addOptions() {
          return {
              HTMLAttributes: {},
          };
      },
      content: 'block+',
      group: 'block',
      defining: true,
      parseHTML() {
          return [
              { tag: 'blockquote' },
          ];
      },
      renderHTML({ HTMLAttributes }) {
          return ['blockquote', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
      },
      addCommands() {
          return {
              setBlockquote: () => ({ commands }) => {
                  return commands.wrapIn(this.name);
              },
              toggleBlockquote: () => ({ commands }) => {
                  return commands.toggleWrap(this.name);
              },
              unsetBlockquote: () => ({ commands }) => {
                  return commands.lift(this.name);
              },
          };
      },
      addKeyboardShortcuts() {
          return {
              'Mod-Shift-b': () => this.editor.commands.toggleBlockquote(),
          };
      },
      addInputRules() {
          return [
              wrappingInputRule({
                  find: inputRegex$2,
                  type: this.type,
              }),
          ];
      },
  });

  const starInputRegex$1 = /(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))$/;
  const starPasteRegex$1 = /(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))/g;
  const underscoreInputRegex$1 = /(?:^|\s)((?:__)((?:[^__]+))(?:__))$/;
  const underscorePasteRegex$1 = /(?:^|\s)((?:__)((?:[^__]+))(?:__))/g;
  const Bold = Mark.create({
      name: 'bold',
      addOptions() {
          return {
              HTMLAttributes: {},
          };
      },
      parseHTML() {
          return [
              {
                  tag: 'strong',
              },
              {
                  tag: 'b',
                  getAttrs: node => node.style.fontWeight !== 'normal' && null,
              },
              {
                  style: 'font-weight',
                  getAttrs: value => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
              },
          ];
      },
      renderHTML({ HTMLAttributes }) {
          return ['strong', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
      },
      addCommands() {
          return {
              setBold: () => ({ commands }) => {
                  return commands.setMark(this.name);
              },
              toggleBold: () => ({ commands }) => {
                  return commands.toggleMark(this.name);
              },
              unsetBold: () => ({ commands }) => {
                  return commands.unsetMark(this.name);
              },
          };
      },
      addKeyboardShortcuts() {
          return {
              'Mod-b': () => this.editor.commands.toggleBold(),
              'Mod-B': () => this.editor.commands.toggleBold(),
          };
      },
      addInputRules() {
          return [
              markInputRule({
                  find: starInputRegex$1,
                  type: this.type,
              }),
              markInputRule({
                  find: underscoreInputRegex$1,
                  type: this.type,
              }),
          ];
      },
      addPasteRules() {
          return [
              markPasteRule({
                  find: starPasteRegex$1,
                  type: this.type,
              }),
              markPasteRule({
                  find: underscorePasteRegex$1,
                  type: this.type,
              }),
          ];
      },
  });

  const starInputRegex = /(?:^|\s)((?:\*)((?:[^*]+))(?:\*))$/;
  const starPasteRegex = /(?:^|\s)((?:\*)((?:[^*]+))(?:\*))/g;
  const underscoreInputRegex = /(?:^|\s)((?:_)((?:[^_]+))(?:_))$/;
  const underscorePasteRegex = /(?:^|\s)((?:_)((?:[^_]+))(?:_))/g;
  const Italic = Mark.create({
      name: 'italic',
      addOptions() {
          return {
              HTMLAttributes: {},
          };
      },
      parseHTML() {
          return [
              {
                  tag: 'em',
              },
              {
                  tag: 'i',
                  getAttrs: node => node.style.fontStyle !== 'normal' && null,
              },
              {
                  style: 'font-style=italic',
              },
          ];
      },
      renderHTML({ HTMLAttributes }) {
          return ['em', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
      },
      addCommands() {
          return {
              setItalic: () => ({ commands }) => {
                  return commands.setMark(this.name);
              },
              toggleItalic: () => ({ commands }) => {
                  return commands.toggleMark(this.name);
              },
              unsetItalic: () => ({ commands }) => {
                  return commands.unsetMark(this.name);
              },
          };
      },
      addKeyboardShortcuts() {
          return {
              'Mod-i': () => this.editor.commands.toggleItalic(),
              'Mod-I': () => this.editor.commands.toggleItalic(),
          };
      },
      addInputRules() {
          return [
              markInputRule({
                  find: starInputRegex,
                  type: this.type,
              }),
              markInputRule({
                  find: underscoreInputRegex,
                  type: this.type,
              }),
          ];
      },
      addPasteRules() {
          return [
              markPasteRule({
                  find: starPasteRegex,
                  type: this.type,
              }),
              markPasteRule({
                  find: underscorePasteRegex,
                  type: this.type,
              }),
          ];
      },
  });

  const inputRegex$1 = /(?:^|\s)((?:`)((?:[^`]+))(?:`))$/;
  const pasteRegex = /(?:^|\s)((?:`)((?:[^`]+))(?:`))/g;
  const Code = Mark.create({
      name: 'code',
      addOptions() {
          return {
              HTMLAttributes: {},
          };
      },
      excludes: '_',
      code: true,
      parseHTML() {
          return [
              { tag: 'code' },
          ];
      },
      renderHTML({ HTMLAttributes }) {
          return ['code', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
      },
      addCommands() {
          return {
              setCode: () => ({ commands }) => {
                  return commands.setMark(this.name);
              },
              toggleCode: () => ({ commands }) => {
                  return commands.toggleMark(this.name);
              },
              unsetCode: () => ({ commands }) => {
                  return commands.unsetMark(this.name);
              },
          };
      },
      addKeyboardShortcuts() {
          return {
              'Mod-e': () => this.editor.commands.toggleCode(),
          };
      },
      addInputRules() {
          return [
              markInputRule({
                  find: inputRegex$1,
                  type: this.type,
              }),
          ];
      },
      addPasteRules() {
          return [
              markPasteRule({
                  find: pasteRegex,
                  type: this.type,
              }),
          ];
      },
  });

  const backtickInputRegex = /^```([a-z]+)?[\s\n]$/;
  const tildeInputRegex = /^~~~([a-z]+)?[\s\n]$/;
  const CodeBlock = Node.create({
      name: 'codeBlock',
      addOptions() {
          return {
              languageClassPrefix: 'language-',
              exitOnTripleEnter: true,
              exitOnArrowDown: true,
              HTMLAttributes: {},
          };
      },
      content: 'text*',
      marks: '',
      group: 'block',
      code: true,
      defining: true,
      addAttributes() {
          return {
              language: {
                  default: null,
                  parseHTML: element => {
                      var _a;
                      const { languageClassPrefix } = this.options;
                      const classNames = [...((_a = element.firstElementChild) === null || _a === void 0 ? void 0 : _a.classList) || []];
                      const languages = classNames
                          .filter(className => className.startsWith(languageClassPrefix))
                          .map(className => className.replace(languageClassPrefix, ''));
                      const language = languages[0];
                      if (!language) {
                          return null;
                      }
                      return language;
                  },
                  rendered: false,
              },
          };
      },
      parseHTML() {
          return [
              {
                  tag: 'pre',
                  preserveWhitespace: 'full',
              },
          ];
      },
      renderHTML({ node, HTMLAttributes }) {
          return [
              'pre',
              mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
              [
                  'code',
                  {
                      class: node.attrs.language
                          ? this.options.languageClassPrefix + node.attrs.language
                          : null,
                  },
                  0,
              ],
          ];
      },
      addCommands() {
          return {
              setCodeBlock: attributes => ({ commands }) => {
                  return commands.setNode(this.name, attributes);
              },
              toggleCodeBlock: attributes => ({ commands }) => {
                  return commands.toggleNode(this.name, 'paragraph', attributes);
              },
          };
      },
      addKeyboardShortcuts() {
          return {
              'Mod-Alt-c': () => this.editor.commands.toggleCodeBlock(),
              Backspace: () => {
                  const { empty, $anchor } = this.editor.state.selection;
                  const isAtStart = $anchor.pos === 1;
                  if (!empty || $anchor.parent.type.name !== this.name) {
                      return false;
                  }
                  if (isAtStart || !$anchor.parent.textContent.length) {
                      return this.editor.commands.clearNodes();
                  }
                  return false;
              },
              Enter: ({ editor }) => {
                  if (!this.options.exitOnTripleEnter) {
                      return false;
                  }
                  const { state } = editor;
                  const { selection } = state;
                  const { $from, empty } = selection;
                  if (!empty || $from.parent.type !== this.type) {
                      return false;
                  }
                  const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;
                  const endsWithDoubleNewline = $from.parent.textContent.endsWith('\n\n');
                  if (!isAtEnd || !endsWithDoubleNewline) {
                      return false;
                  }
                  return editor
                      .chain()
                      .command(({ tr }) => {
                      tr.delete($from.pos - 2, $from.pos);
                      return true;
                  })
                      .exitCode()
                      .run();
              },
              ArrowDown: ({ editor }) => {
                  if (!this.options.exitOnArrowDown) {
                      return false;
                  }
                  const { state } = editor;
                  const { selection, doc } = state;
                  const { $from, empty } = selection;
                  if (!empty || $from.parent.type !== this.type) {
                      return false;
                  }
                  const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;
                  if (!isAtEnd) {
                      return false;
                  }
                  const after = $from.after();
                  if (after === undefined) {
                      return false;
                  }
                  const nodeAfter = doc.nodeAt(after);
                  if (nodeAfter) {
                      return false;
                  }
                  return editor.commands.exitCode();
              },
          };
      },
      addInputRules() {
          return [
              textblockTypeInputRule({
                  find: backtickInputRegex,
                  type: this.type,
                  getAttributes: match => ({
                      language: match[1],
                  }),
              }),
              textblockTypeInputRule({
                  find: tildeInputRegex,
                  type: this.type,
                  getAttributes: match => ({
                      language: match[1],
                  }),
              }),
          ];
      },
      addProseMirrorPlugins() {
          return [
              new Plugin({
                  key: new PluginKey('codeBlockVSCodeHandler'),
                  props: {
                      handlePaste: (view, event) => {
                          if (!event.clipboardData) {
                              return false;
                          }
                          if (this.editor.isActive(this.type.name)) {
                              return false;
                          }
                          const text = event.clipboardData.getData('text/plain');
                          const vscode = event.clipboardData.getData('vscode-editor-data');
                          const vscodeData = vscode
                              ? JSON.parse(vscode)
                              : undefined;
                          const language = vscodeData === null || vscodeData === void 0 ? void 0 : vscodeData.mode;
                          if (!text || !language) {
                              return false;
                          }
                          const { tr } = view.state;
                          tr.replaceSelectionWith(this.type.create({ language }));
                          tr.setSelection(TextSelection.near(tr.doc.resolve(Math.max(0, tr.selection.from - 2))));
                          tr.insertText(text.replace(/\r\n?/g, '\n'));
                          tr.setMeta('paste', true);
                          view.dispatch(tr);
                          return true;
                      },
                  },
              }),
          ];
      },
  });

  const inputRegex = /(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))$/;
  const Image = Node.create({
      name: 'image',
      addOptions() {
          return {
              inline: false,
              allowBase64: false,
              HTMLAttributes: {},
          };
      },
      inline() {
          return this.options.inline;
      },
      group() {
          return this.options.inline ? 'inline' : 'block';
      },
      draggable: true,
      addAttributes() {
          return {
              src: {
                  default: null,
              },
              alt: {
                  default: null,
              },
              title: {
                  default: null,
              },
          };
      },
      parseHTML() {
          return [
              {
                  tag: this.options.allowBase64
                      ? 'img[src]'
                      : 'img[src]:not([src^="data:"])',
              },
          ];
      },
      renderHTML({ HTMLAttributes }) {
          return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
      },
      addCommands() {
          return {
              setImage: options => ({ commands }) => {
                  return commands.insertContent({
                      type: this.name,
                      attrs: options,
                  });
              },
          };
      },
      addInputRules() {
          return [
              nodeInputRule({
                  find: inputRegex,
                  type: this.type,
                  getAttributes: match => {
                      const [, , alt, src, title] = match;
                      return { src, alt, title };
                  },
              }),
          ];
      },
  });

  function State(token) {
    this.j = {};
    this.jr = [];
    this.jd = null;
    this.t = token;
  }
  State.prototype = {
    accepts: function accepts() {
      return !!this.t;
    },
    tt: function tt(input, tokenOrState) {
      if (tokenOrState && tokenOrState.j) {
        this.j[input] = tokenOrState;
        return tokenOrState;
      }
      var token = tokenOrState;
      var nextState = this.j[input];
      if (nextState) {
        if (token) {
          nextState.t = token;
        }
        return nextState;
      }
      nextState = makeState();
      var templateState = takeT(this, input);
      if (templateState) {
        Object.assign(nextState.j, templateState.j);
        nextState.jr.append(templateState.jr);
        nextState.jr = templateState.jd;
        nextState.t = token || templateState.t;
      } else {
        nextState.t = token;
      }
      this.j[input] = nextState;
      return nextState;
    }
  };
  var makeState = function makeState() {
    return new State();
  };
  var makeAcceptingState = function makeAcceptingState(token) {
    return new State(token);
  };
  var makeT = function makeT(startState, input, nextState) {
    if (!startState.j[input]) {
      startState.j[input] = nextState;
    }
  };
  var makeRegexT = function makeRegexT(startState, regex, nextState) {
    startState.jr.push([regex, nextState]);
  };
  var takeT = function takeT(state, input) {
    var nextState = state.j[input];
    if (nextState) {
      return nextState;
    }
    for (var i = 0; i < state.jr.length; i++) {
      var regex = state.jr[i][0];
      var _nextState = state.jr[i][1];
      if (regex.test(input)) {
        return _nextState;
      }
    }
    return state.jd;
  };
  var makeMultiT = function makeMultiT(startState, chars, nextState) {
    for (var i = 0; i < chars.length; i++) {
      makeT(startState, chars[i], nextState);
    }
  };
  var makeBatchT = function makeBatchT(startState, transitions) {
    for (var i = 0; i < transitions.length; i++) {
      var input = transitions[i][0];
      var nextState = transitions[i][1];
      makeT(startState, input, nextState);
    }
  };
  var makeChainT = function makeChainT(state, str, endState, defaultStateFactory) {
    var i = 0,
        len = str.length,
        nextState;
    while (i < len && (nextState = state.j[str[i]])) {
      state = nextState;
      i++;
    }
    if (i >= len) {
      return [];
    }
    while (i < len - 1) {
      nextState = defaultStateFactory();
      makeT(state, str[i], nextState);
      state = nextState;
      i++;
    }
    makeT(state, str[len - 1], endState);
  };
  var DOMAIN = 'DOMAIN';
  var LOCALHOST = 'LOCALHOST';
  var TLD = 'TLD';
  var NUM = 'NUM';
  var PROTOCOL = 'PROTOCOL';
  var MAILTO = 'MAILTO';
  var WS = 'WS';
  var NL = 'NL';
  var OPENBRACE = 'OPENBRACE';
  var OPENBRACKET = 'OPENBRACKET';
  var OPENANGLEBRACKET = 'OPENANGLEBRACKET';
  var OPENPAREN = 'OPENPAREN';
  var CLOSEBRACE = 'CLOSEBRACE';
  var CLOSEBRACKET = 'CLOSEBRACKET';
  var CLOSEANGLEBRACKET = 'CLOSEANGLEBRACKET';
  var CLOSEPAREN = 'CLOSEPAREN';
  var AMPERSAND = 'AMPERSAND';
  var APOSTROPHE = 'APOSTROPHE';
  var ASTERISK = 'ASTERISK';
  var AT = 'AT';
  var BACKSLASH = 'BACKSLASH';
  var BACKTICK = 'BACKTICK';
  var CARET = 'CARET';
  var COLON = 'COLON';
  var COMMA = 'COMMA';
  var DOLLAR = 'DOLLAR';
  var DOT = 'DOT';
  var EQUALS = 'EQUALS';
  var EXCLAMATION = 'EXCLAMATION';
  var HYPHEN = 'HYPHEN';
  var PERCENT = 'PERCENT';
  var PIPE = 'PIPE';
  var PLUS = 'PLUS';
  var POUND = 'POUND';
  var QUERY = 'QUERY';
  var QUOTE = 'QUOTE';
  var SEMI = 'SEMI';
  var SLASH = 'SLASH';
  var TILDE = 'TILDE';
  var UNDERSCORE = 'UNDERSCORE';
  var SYM = 'SYM';
  var text = Object.freeze({
  	__proto__: null,
  	DOMAIN: DOMAIN,
  	LOCALHOST: LOCALHOST,
  	TLD: TLD,
  	NUM: NUM,
  	PROTOCOL: PROTOCOL,
  	MAILTO: MAILTO,
  	WS: WS,
  	NL: NL,
  	OPENBRACE: OPENBRACE,
  	OPENBRACKET: OPENBRACKET,
  	OPENANGLEBRACKET: OPENANGLEBRACKET,
  	OPENPAREN: OPENPAREN,
  	CLOSEBRACE: CLOSEBRACE,
  	CLOSEBRACKET: CLOSEBRACKET,
  	CLOSEANGLEBRACKET: CLOSEANGLEBRACKET,
  	CLOSEPAREN: CLOSEPAREN,
  	AMPERSAND: AMPERSAND,
  	APOSTROPHE: APOSTROPHE,
  	ASTERISK: ASTERISK,
  	AT: AT,
  	BACKSLASH: BACKSLASH,
  	BACKTICK: BACKTICK,
  	CARET: CARET,
  	COLON: COLON,
  	COMMA: COMMA,
  	DOLLAR: DOLLAR,
  	DOT: DOT,
  	EQUALS: EQUALS,
  	EXCLAMATION: EXCLAMATION,
  	HYPHEN: HYPHEN,
  	PERCENT: PERCENT,
  	PIPE: PIPE,
  	PLUS: PLUS,
  	POUND: POUND,
  	QUERY: QUERY,
  	QUOTE: QUOTE,
  	SEMI: SEMI,
  	SLASH: SLASH,
  	TILDE: TILDE,
  	UNDERSCORE: UNDERSCORE,
  	SYM: SYM
  });
  var tlds = 'aaa \
aarp \
abarth \
abb \
abbott \
abbvie \
abc \
able \
abogado \
abudhabi \
ac \
academy \
accenture \
accountant \
accountants \
aco \
actor \
ad \
adac \
ads \
adult \
ae \
aeg \
aero \
aetna \
af \
afamilycompany \
afl \
africa \
ag \
agakhan \
agency \
ai \
aig \
airbus \
airforce \
airtel \
akdn \
al \
alfaromeo \
alibaba \
alipay \
allfinanz \
allstate \
ally \
alsace \
alstom \
am \
amazon \
americanexpress \
americanfamily \
amex \
amfam \
amica \
amsterdam \
analytics \
android \
anquan \
anz \
ao \
aol \
apartments \
app \
apple \
aq \
aquarelle \
ar \
arab \
aramco \
archi \
army \
arpa \
art \
arte \
as \
asda \
asia \
associates \
at \
athleta \
attorney \
au \
auction \
audi \
audible \
audio \
auspost \
author \
auto \
autos \
avianca \
aw \
aws \
ax \
axa \
az \
azure \
ba \
baby \
baidu \
banamex \
bananarepublic \
band \
bank \
bar \
barcelona \
barclaycard \
barclays \
barefoot \
bargains \
baseball \
basketball \
bauhaus \
bayern \
bb \
bbc \
bbt \
bbva \
bcg \
bcn \
bd \
be \
beats \
beauty \
beer \
bentley \
berlin \
best \
bestbuy \
bet \
bf \
bg \
bh \
bharti \
bi \
bible \
bid \
bike \
bing \
bingo \
bio \
biz \
bj \
black \
blackfriday \
blockbuster \
blog \
bloomberg \
blue \
bm \
bms \
bmw \
bn \
bnpparibas \
bo \
boats \
boehringer \
bofa \
bom \
bond \
boo \
book \
booking \
bosch \
bostik \
boston \
bot \
boutique \
box \
br \
bradesco \
bridgestone \
broadway \
broker \
brother \
brussels \
bs \
bt \
budapest \
bugatti \
build \
builders \
business \
buy \
buzz \
bv \
bw \
by \
bz \
bzh \
ca \
cab \
cafe \
cal \
call \
calvinklein \
cam \
camera \
camp \
cancerresearch \
canon \
capetown \
capital \
capitalone \
car \
caravan \
cards \
care \
career \
careers \
cars \
casa \
case \
cash \
casino \
cat \
catering \
catholic \
cba \
cbn \
cbre \
cbs \
cc \
cd \
center \
ceo \
cern \
cf \
cfa \
cfd \
cg \
ch \
chanel \
channel \
charity \
chase \
chat \
cheap \
chintai \
christmas \
chrome \
church \
ci \
cipriani \
circle \
cisco \
citadel \
citi \
citic \
city \
cityeats \
ck \
cl \
claims \
cleaning \
click \
clinic \
clinique \
clothing \
cloud \
club \
clubmed \
cm \
cn \
co \
coach \
codes \
coffee \
college \
cologne \
com \
comcast \
commbank \
community \
company \
compare \
computer \
comsec \
condos \
construction \
consulting \
contact \
contractors \
cooking \
cookingchannel \
cool \
coop \
corsica \
country \
coupon \
coupons \
courses \
cpa \
cr \
credit \
creditcard \
creditunion \
cricket \
crown \
crs \
cruise \
cruises \
csc \
cu \
cuisinella \
cv \
cw \
cx \
cy \
cymru \
cyou \
cz \
dabur \
dad \
dance \
data \
date \
dating \
datsun \
day \
dclk \
dds \
de \
deal \
dealer \
deals \
degree \
delivery \
dell \
deloitte \
delta \
democrat \
dental \
dentist \
desi \
design \
dev \
dhl \
diamonds \
diet \
digital \
direct \
directory \
discount \
discover \
dish \
diy \
dj \
dk \
dm \
dnp \
do \
docs \
doctor \
dog \
domains \
dot \
download \
drive \
dtv \
dubai \
duck \
dunlop \
dupont \
durban \
dvag \
dvr \
dz \
earth \
eat \
ec \
eco \
edeka \
edu \
education \
ee \
eg \
email \
emerck \
energy \
engineer \
engineering \
enterprises \
epson \
equipment \
er \
ericsson \
erni \
es \
esq \
estate \
et \
etisalat \
eu \
eurovision \
eus \
events \
exchange \
expert \
exposed \
express \
extraspace \
fage \
fail \
fairwinds \
faith \
family \
fan \
fans \
farm \
farmers \
fashion \
fast \
fedex \
feedback \
ferrari \
ferrero \
fi \
fiat \
fidelity \
fido \
film \
final \
finance \
financial \
fire \
firestone \
firmdale \
fish \
fishing \
fit \
fitness \
fj \
fk \
flickr \
flights \
flir \
florist \
flowers \
fly \
fm \
fo \
foo \
food \
foodnetwork \
football \
ford \
forex \
forsale \
forum \
foundation \
fox \
fr \
free \
fresenius \
frl \
frogans \
frontdoor \
frontier \
ftr \
fujitsu \
fujixerox \
fun \
fund \
furniture \
futbol \
fyi \
ga \
gal \
gallery \
gallo \
gallup \
game \
games \
gap \
garden \
gay \
gb \
gbiz \
gd \
gdn \
ge \
gea \
gent \
genting \
george \
gf \
gg \
ggee \
gh \
gi \
gift \
gifts \
gives \
giving \
gl \
glade \
glass \
gle \
global \
globo \
gm \
gmail \
gmbh \
gmo \
gmx \
gn \
godaddy \
gold \
goldpoint \
golf \
goo \
goodyear \
goog \
google \
gop \
got \
gov \
gp \
gq \
gr \
grainger \
graphics \
gratis \
green \
gripe \
grocery \
group \
gs \
gt \
gu \
guardian \
gucci \
guge \
guide \
guitars \
guru \
gw \
gy \
hair \
hamburg \
hangout \
haus \
hbo \
hdfc \
hdfcbank \
health \
healthcare \
help \
helsinki \
here \
hermes \
hgtv \
hiphop \
hisamitsu \
hitachi \
hiv \
hk \
hkt \
hm \
hn \
hockey \
holdings \
holiday \
homedepot \
homegoods \
homes \
homesense \
honda \
horse \
hospital \
host \
hosting \
hot \
hoteles \
hotels \
hotmail \
house \
how \
hr \
hsbc \
ht \
hu \
hughes \
hyatt \
hyundai \
ibm \
icbc \
ice \
icu \
id \
ie \
ieee \
ifm \
ikano \
il \
im \
imamat \
imdb \
immo \
immobilien \
in \
inc \
industries \
infiniti \
info \
ing \
ink \
institute \
insurance \
insure \
int \
international \
intuit \
investments \
io \
ipiranga \
iq \
ir \
irish \
is \
ismaili \
ist \
istanbul \
it \
itau \
itv \
iveco \
jaguar \
java \
jcb \
je \
jeep \
jetzt \
jewelry \
jio \
jll \
jm \
jmp \
jnj \
jo \
jobs \
joburg \
jot \
joy \
jp \
jpmorgan \
jprs \
juegos \
juniper \
kaufen \
kddi \
ke \
kerryhotels \
kerrylogistics \
kerryproperties \
kfh \
kg \
kh \
ki \
kia \
kim \
kinder \
kindle \
kitchen \
kiwi \
km \
kn \
koeln \
komatsu \
kosher \
kp \
kpmg \
kpn \
kr \
krd \
kred \
kuokgroup \
kw \
ky \
kyoto \
kz \
la \
lacaixa \
lamborghini \
lamer \
lancaster \
lancia \
land \
landrover \
lanxess \
lasalle \
lat \
latino \
latrobe \
law \
lawyer \
lb \
lc \
lds \
lease \
leclerc \
lefrak \
legal \
lego \
lexus \
lgbt \
li \
lidl \
life \
lifeinsurance \
lifestyle \
lighting \
like \
lilly \
limited \
limo \
lincoln \
linde \
link \
lipsy \
live \
living \
lixil \
lk \
llc \
llp \
loan \
loans \
locker \
locus \
loft \
lol \
london \
lotte \
lotto \
love \
lpl \
lplfinancial \
lr \
ls \
lt \
ltd \
ltda \
lu \
lundbeck \
luxe \
luxury \
lv \
ly \
ma \
macys \
madrid \
maif \
maison \
makeup \
man \
management \
mango \
map \
market \
marketing \
markets \
marriott \
marshalls \
maserati \
mattel \
mba \
mc \
mckinsey \
md \
me \
med \
media \
meet \
melbourne \
meme \
memorial \
men \
menu \
merckmsd \
mg \
mh \
miami \
microsoft \
mil \
mini \
mint \
mit \
mitsubishi \
mk \
ml \
mlb \
mls \
mm \
mma \
mn \
mo \
mobi \
mobile \
moda \
moe \
moi \
mom \
monash \
money \
monster \
mormon \
mortgage \
moscow \
moto \
motorcycles \
mov \
movie \
mp \
mq \
mr \
ms \
msd \
mt \
mtn \
mtr \
mu \
museum \
mutual \
mv \
mw \
mx \
my \
mz \
na \
nab \
nagoya \
name \
nationwide \
natura \
navy \
nba \
nc \
ne \
nec \
net \
netbank \
netflix \
network \
neustar \
new \
news \
next \
nextdirect \
nexus \
nf \
nfl \
ng \
ngo \
nhk \
ni \
nico \
nike \
nikon \
ninja \
nissan \
nissay \
nl \
no \
nokia \
northwesternmutual \
norton \
now \
nowruz \
nowtv \
np \
nr \
nra \
nrw \
ntt \
nu \
nyc \
nz \
obi \
observer \
off \
office \
okinawa \
olayan \
olayangroup \
oldnavy \
ollo \
om \
omega \
one \
ong \
onl \
online \
onyourside \
ooo \
open \
oracle \
orange \
org \
organic \
origins \
osaka \
otsuka \
ott \
ovh \
pa \
page \
panasonic \
paris \
pars \
partners \
parts \
party \
passagens \
pay \
pccw \
pe \
pet \
pf \
pfizer \
pg \
ph \
pharmacy \
phd \
philips \
phone \
photo \
photography \
photos \
physio \
pics \
pictet \
pictures \
pid \
pin \
ping \
pink \
pioneer \
pizza \
pk \
pl \
place \
play \
playstation \
plumbing \
plus \
pm \
pn \
pnc \
pohl \
poker \
politie \
porn \
post \
pr \
pramerica \
praxi \
press \
prime \
pro \
prod \
productions \
prof \
progressive \
promo \
properties \
property \
protection \
pru \
prudential \
ps \
pt \
pub \
pw \
pwc \
py \
qa \
qpon \
quebec \
quest \
qvc \
racing \
radio \
raid \
re \
read \
realestate \
realtor \
realty \
recipes \
red \
redstone \
redumbrella \
rehab \
reise \
reisen \
reit \
reliance \
ren \
rent \
rentals \
repair \
report \
republican \
rest \
restaurant \
review \
reviews \
rexroth \
rich \
richardli \
ricoh \
ril \
rio \
rip \
rmit \
ro \
rocher \
rocks \
rodeo \
rogers \
room \
rs \
rsvp \
ru \
rugby \
ruhr \
run \
rw \
rwe \
ryukyu \
sa \
saarland \
safe \
safety \
sakura \
sale \
salon \
samsclub \
samsung \
sandvik \
sandvikcoromant \
sanofi \
sap \
sarl \
sas \
save \
saxo \
sb \
sbi \
sbs \
sc \
sca \
scb \
schaeffler \
schmidt \
scholarships \
school \
schule \
schwarz \
science \
scjohnson \
scot \
sd \
se \
search \
seat \
secure \
security \
seek \
select \
sener \
services \
ses \
seven \
sew \
sex \
sexy \
sfr \
sg \
sh \
shangrila \
sharp \
shaw \
shell \
shia \
shiksha \
shoes \
shop \
shopping \
shouji \
show \
showtime \
si \
silk \
sina \
singles \
site \
sj \
sk \
ski \
skin \
sky \
skype \
sl \
sling \
sm \
smart \
smile \
sn \
sncf \
so \
soccer \
social \
softbank \
software \
sohu \
solar \
solutions \
song \
sony \
soy \
spa \
space \
sport \
spot \
spreadbetting \
sr \
srl \
ss \
st \
stada \
staples \
star \
statebank \
statefarm \
stc \
stcgroup \
stockholm \
storage \
store \
stream \
studio \
study \
style \
su \
sucks \
supplies \
supply \
support \
surf \
surgery \
suzuki \
sv \
swatch \
swiftcover \
swiss \
sx \
sy \
sydney \
systems \
sz \
tab \
taipei \
talk \
taobao \
target \
tatamotors \
tatar \
tattoo \
tax \
taxi \
tc \
tci \
td \
tdk \
team \
tech \
technology \
tel \
temasek \
tennis \
teva \
tf \
tg \
th \
thd \
theater \
theatre \
tiaa \
tickets \
tienda \
tiffany \
tips \
tires \
tirol \
tj \
tjmaxx \
tjx \
tk \
tkmaxx \
tl \
tm \
tmall \
tn \
to \
today \
tokyo \
tools \
top \
toray \
toshiba \
total \
tours \
town \
toyota \
toys \
tr \
trade \
trading \
training \
travel \
travelchannel \
travelers \
travelersinsurance \
trust \
trv \
tt \
tube \
tui \
tunes \
tushu \
tv \
tvs \
tw \
tz \
ua \
ubank \
ubs \
ug \
uk \
unicom \
university \
uno \
uol \
ups \
us \
uy \
uz \
va \
vacations \
vana \
vanguard \
vc \
ve \
vegas \
ventures \
verisign \
versicherung \
vet \
vg \
vi \
viajes \
video \
vig \
viking \
villas \
vin \
vip \
virgin \
visa \
vision \
viva \
vivo \
vlaanderen \
vn \
vodka \
volkswagen \
volvo \
vote \
voting \
voto \
voyage \
vu \
vuelos \
wales \
walmart \
walter \
wang \
wanggou \
watch \
watches \
weather \
weatherchannel \
webcam \
weber \
website \
wed \
wedding \
weibo \
weir \
wf \
whoswho \
wien \
wiki \
williamhill \
win \
windows \
wine \
winners \
wme \
wolterskluwer \
woodside \
work \
works \
world \
wow \
ws \
wtc \
wtf \
xbox \
xerox \
xfinity \
xihuan \
xin \
xxx \
xyz \
yachts \
yahoo \
yamaxun \
yandex \
ye \
yodobashi \
yoga \
yokohama \
you \
youtube \
yt \
yun \
za \
zappos \
zara \
zero \
zip \
zm \
zone \
zuerich \
zw \
vermögensberater-ctb \
vermögensberatung-pwb \
ελ \
ευ \
бг \
бел \
дети \
ею \
католик \
ком \
қаз \
мкд \
мон \
москва \
онлайн \
орг \
рус \
рф \
сайт \
срб \
укр \
გე \
հայ \
ישראל \
קום \
ابوظبي \
اتصالات \
ارامكو \
الاردن \
البحرين \
الجزائر \
السعودية \
العليان \
المغرب \
امارات \
ایران \
بارت \
بازار \
بھارت \
بيتك \
پاکستان \
ڀارت \
تونس \
سودان \
سورية \
شبكة \
عراق \
عرب \
عمان \
فلسطين \
قطر \
كاثوليك \
كوم \
مصر \
مليسيا \
موريتانيا \
موقع \
همراه \
कॉम \
नेट \
भारत \
भारतम् \
भारोत \
संगठन \
বাংলা \
ভারত \
ভাৰত \
ਭਾਰਤ \
ભારત \
ଭାରତ \
இந்தியா \
இலங்கை \
சிங்கப்பூர் \
భారత్ \
ಭಾರತ \
ഭാരതം \
ලංකා \
คอม \
ไทย \
ລາວ \
닷넷 \
닷컴 \
삼성 \
한국 \
アマゾン \
グーグル \
クラウド \
コム \
ストア \
セール \
ファッション \
ポイント \
みんな \
世界 \
中信 \
中国 \
中國 \
中文网 \
亚马逊 \
企业 \
佛山 \
信息 \
健康 \
八卦 \
公司 \
公益 \
台湾 \
台灣 \
商城 \
商店 \
商标 \
嘉里 \
嘉里大酒店 \
在线 \
大众汽车 \
大拿 \
天主教 \
娱乐 \
家電 \
广东 \
微博 \
慈善 \
我爱你 \
手机 \
招聘 \
政务 \
政府 \
新加坡 \
新闻 \
时尚 \
書籍 \
机构 \
淡马锡 \
游戏 \
澳門 \
点看 \
移动 \
组织机构 \
网址 \
网店 \
网站 \
网络 \
联通 \
诺基亚 \
谷歌 \
购物 \
通販 \
集团 \
電訊盈科 \
飞利浦 \
食品 \
餐厅 \
香格里拉 \
香港'.split(' ');
  var LETTER = /(?:[A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088E\u08A0-\u08C9\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5D\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4C\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7CA\uA7D0\uA7D1\uA7D3\uA7D5-\uA7D9\uA7F2-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDD70-\uDD7A\uDD7C-\uDD8A\uDD8C-\uDD92\uDD94\uDD95\uDD97-\uDDA1\uDDA3-\uDDB1\uDDB3-\uDDB9\uDDBB\uDDBC\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67\uDF80-\uDF85\uDF87-\uDFB0\uDFB2-\uDFBA]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD23\uDE80-\uDEA9\uDEB0\uDEB1\uDF00-\uDF1C\uDF27\uDF30-\uDF45\uDF70-\uDF81\uDFB0-\uDFC4\uDFE0-\uDFF6]|\uD804[\uDC03-\uDC37\uDC71\uDC72\uDC75\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD44\uDD47\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC5F-\uDC61\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDEB8\uDF00-\uDF1A\uDF40-\uDF46]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCDF\uDCFF-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD2F\uDD3F\uDD41\uDDA0-\uDDA7\uDDAA-\uDDD0\uDDE1\uDDE3\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE89\uDE9D\uDEB0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDEE0-\uDEF2\uDFB0]|\uD808[\uDC00-\uDF99]|\uD809[\uDC80-\uDD43]|\uD80B[\uDF90-\uDFF0]|[\uD80C\uD81C-\uD820\uD822\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE70-\uDEBE\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF4A\uDF50\uDF93-\uDF9F\uDFE0\uDFE1\uDFE3]|\uD821[\uDC00-\uDFF7]|\uD823[\uDC00-\uDCD5\uDD00-\uDD08]|\uD82B[\uDFF0-\uDFF3\uDFF5-\uDFFB\uDFFD\uDFFE]|\uD82C[\uDC00-\uDD22\uDD50-\uDD52\uDD64-\uDD67\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD837[\uDF00-\uDF1E]|\uD838[\uDD00-\uDD2C\uDD37-\uDD3D\uDD4E\uDE90-\uDEAD\uDEC0-\uDEEB]|\uD839[\uDFE0-\uDFE6\uDFE8-\uDFEB\uDFED\uDFEE\uDFF0-\uDFFE]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43\uDD4B]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDEDF\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF38\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A])/;
  var EMOJI = /(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5-\uDED7\uDEDD-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDDFF\uDE70-\uDE74\uDE78-\uDE7C\uDE80-\uDE86\uDE90-\uDEAC\uDEB0-\uDEBA\uDEC0-\uDEC5\uDED0-\uDED9\uDEE0-\uDEE7\uDEF0-\uDEF6])/;
  var EMOJI_VARIATION = /\uFE0F/;
  var DIGIT = /\d/;
  var SPACE = /\s/;
  function init$2() {
    var customProtocols = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var S_START = makeState();
    var S_NUM = makeAcceptingState(NUM);
    var S_DOMAIN = makeAcceptingState(DOMAIN);
    var S_DOMAIN_HYPHEN = makeState();
    var S_WS = makeAcceptingState(WS);
    var DOMAIN_REGEX_TRANSITIONS = [[DIGIT, S_DOMAIN], [LETTER, S_DOMAIN], [EMOJI, S_DOMAIN], [EMOJI_VARIATION, S_DOMAIN]];
    var makeDomainState = function makeDomainState() {
      var state = makeAcceptingState(DOMAIN);
      state.j = {
        '-': S_DOMAIN_HYPHEN
      };
      state.jr = [].concat(DOMAIN_REGEX_TRANSITIONS);
      return state;
    };
    var makeNearDomainState = function makeNearDomainState(token) {
      var state = makeDomainState();
      state.t = token;
      return state;
    };
    makeBatchT(S_START, [["'", makeAcceptingState(APOSTROPHE)], ['{', makeAcceptingState(OPENBRACE)], ['[', makeAcceptingState(OPENBRACKET)], ['<', makeAcceptingState(OPENANGLEBRACKET)], ['(', makeAcceptingState(OPENPAREN)], ['}', makeAcceptingState(CLOSEBRACE)], [']', makeAcceptingState(CLOSEBRACKET)], ['>', makeAcceptingState(CLOSEANGLEBRACKET)], [')', makeAcceptingState(CLOSEPAREN)], ['&', makeAcceptingState(AMPERSAND)], ['*', makeAcceptingState(ASTERISK)], ['@', makeAcceptingState(AT)], ['`', makeAcceptingState(BACKTICK)], ['^', makeAcceptingState(CARET)], [':', makeAcceptingState(COLON)], [',', makeAcceptingState(COMMA)], ['$', makeAcceptingState(DOLLAR)], ['.', makeAcceptingState(DOT)], ['=', makeAcceptingState(EQUALS)], ['!', makeAcceptingState(EXCLAMATION)], ['-', makeAcceptingState(HYPHEN)], ['%', makeAcceptingState(PERCENT)], ['|', makeAcceptingState(PIPE)], ['+', makeAcceptingState(PLUS)], ['#', makeAcceptingState(POUND)], ['?', makeAcceptingState(QUERY)], ['"', makeAcceptingState(QUOTE)], ['/', makeAcceptingState(SLASH)], [';', makeAcceptingState(SEMI)], ['~', makeAcceptingState(TILDE)], ['_', makeAcceptingState(UNDERSCORE)], ['\\', makeAcceptingState(BACKSLASH)]]);
    makeT(S_START, '\n', makeAcceptingState(NL));
    makeRegexT(S_START, SPACE, S_WS);
    makeT(S_WS, '\n', makeState());
    makeRegexT(S_WS, SPACE, S_WS);
    for (var i = 0; i < tlds.length; i++) {
      makeChainT(S_START, tlds[i], makeNearDomainState(TLD), makeDomainState);
    }
    var S_PROTOCOL_FILE = makeDomainState();
    var S_PROTOCOL_FTP = makeDomainState();
    var S_PROTOCOL_HTTP = makeDomainState();
    var S_MAILTO = makeDomainState();
    makeChainT(S_START, 'file', S_PROTOCOL_FILE, makeDomainState);
    makeChainT(S_START, 'ftp', S_PROTOCOL_FTP, makeDomainState);
    makeChainT(S_START, 'http', S_PROTOCOL_HTTP, makeDomainState);
    makeChainT(S_START, 'mailto', S_MAILTO, makeDomainState);
    var S_PROTOCOL_SECURE = makeDomainState();
    var S_FULL_PROTOCOL = makeAcceptingState(PROTOCOL);
    var S_FULL_MAILTO = makeAcceptingState(MAILTO);
    makeT(S_PROTOCOL_FTP, 's', S_PROTOCOL_SECURE);
    makeT(S_PROTOCOL_FTP, ':', S_FULL_PROTOCOL);
    makeT(S_PROTOCOL_HTTP, 's', S_PROTOCOL_SECURE);
    makeT(S_PROTOCOL_HTTP, ':', S_FULL_PROTOCOL);
    makeT(S_PROTOCOL_FILE, ':', S_FULL_PROTOCOL);
    makeT(S_PROTOCOL_SECURE, ':', S_FULL_PROTOCOL);
    makeT(S_MAILTO, ':', S_FULL_MAILTO);
    var S_CUSTOM_PROTOCOL = makeDomainState();
    for (var _i = 0; _i < customProtocols.length; _i++) {
      makeChainT(S_START, customProtocols[_i], S_CUSTOM_PROTOCOL, makeDomainState);
    }
    makeT(S_CUSTOM_PROTOCOL, ':', S_FULL_PROTOCOL);
    makeChainT(S_START, 'localhost', makeNearDomainState(LOCALHOST), makeDomainState);
    makeRegexT(S_START, DIGIT, S_NUM);
    makeRegexT(S_START, LETTER, S_DOMAIN);
    makeRegexT(S_START, EMOJI, S_DOMAIN);
    makeRegexT(S_START, EMOJI_VARIATION, S_DOMAIN);
    makeRegexT(S_NUM, DIGIT, S_NUM);
    makeRegexT(S_NUM, LETTER, S_DOMAIN);
    makeRegexT(S_NUM, EMOJI, S_DOMAIN);
    makeRegexT(S_NUM, EMOJI_VARIATION, S_DOMAIN);
    makeT(S_NUM, '-', S_DOMAIN_HYPHEN);
    makeT(S_DOMAIN, '-', S_DOMAIN_HYPHEN);
    makeT(S_DOMAIN_HYPHEN, '-', S_DOMAIN_HYPHEN);
    makeRegexT(S_DOMAIN, DIGIT, S_DOMAIN);
    makeRegexT(S_DOMAIN, LETTER, S_DOMAIN);
    makeRegexT(S_DOMAIN, EMOJI, S_DOMAIN);
    makeRegexT(S_DOMAIN, EMOJI_VARIATION, S_DOMAIN);
    makeRegexT(S_DOMAIN_HYPHEN, DIGIT, S_DOMAIN);
    makeRegexT(S_DOMAIN_HYPHEN, LETTER, S_DOMAIN);
    makeRegexT(S_DOMAIN_HYPHEN, EMOJI, S_DOMAIN);
    makeRegexT(S_DOMAIN_HYPHEN, EMOJI_VARIATION, S_DOMAIN);
    S_START.jd = makeAcceptingState(SYM);
    return S_START;
  }
  function run$1(start, str) {
    var iterable = stringToArray(str.replace(/[A-Z]/g, function (c) {
      return c.toLowerCase();
    }));
    var charCount = iterable.length;
    var tokens = [];
    var cursor = 0;
    var charCursor = 0;
    while (charCursor < charCount) {
      var state = start;
      var nextState = null;
      var tokenLength = 0;
      var latestAccepting = null;
      var sinceAccepts = -1;
      var charsSinceAccepts = -1;
      while (charCursor < charCount && (nextState = takeT(state, iterable[charCursor]))) {
        state = nextState;
        if (state.accepts()) {
          sinceAccepts = 0;
          charsSinceAccepts = 0;
          latestAccepting = state;
        } else if (sinceAccepts >= 0) {
          sinceAccepts += iterable[charCursor].length;
          charsSinceAccepts++;
        }
        tokenLength += iterable[charCursor].length;
        cursor += iterable[charCursor].length;
        charCursor++;
      }
      cursor -= sinceAccepts;
      charCursor -= charsSinceAccepts;
      tokenLength -= sinceAccepts;
      tokens.push({
        t: latestAccepting.t,
        v: str.substr(cursor - tokenLength, tokenLength),
        s: cursor - tokenLength,
        e: cursor
      });
    }
    return tokens;
  }
  function stringToArray(str) {
    var result = [];
    var len = str.length;
    var index = 0;
    while (index < len) {
      var first = str.charCodeAt(index);
      var second = void 0;
      var char = first < 0xd800 || first > 0xdbff || index + 1 === len || (second = str.charCodeAt(index + 1)) < 0xdc00 || second > 0xdfff ? str[index]
      : str.slice(index, index + 2);
      result.push(char);
      index += char.length;
    }
    return result;
  }
  function _typeof(obj) {
    "@babel/helpers - typeof";
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }
    return _typeof(obj);
  }
  var defaults = {
    defaultProtocol: 'http',
    events: null,
    format: noop,
    formatHref: noop,
    nl2br: false,
    tagName: 'a',
    target: null,
    rel: null,
    validate: true,
    truncate: 0,
    className: null,
    attributes: null,
    ignoreTags: []
  };
  function Options(opts) {
    opts = opts || {};
    this.defaultProtocol = 'defaultProtocol' in opts ? opts.defaultProtocol : defaults.defaultProtocol;
    this.events = 'events' in opts ? opts.events : defaults.events;
    this.format = 'format' in opts ? opts.format : defaults.format;
    this.formatHref = 'formatHref' in opts ? opts.formatHref : defaults.formatHref;
    this.nl2br = 'nl2br' in opts ? opts.nl2br : defaults.nl2br;
    this.tagName = 'tagName' in opts ? opts.tagName : defaults.tagName;
    this.target = 'target' in opts ? opts.target : defaults.target;
    this.rel = 'rel' in opts ? opts.rel : defaults.rel;
    this.validate = 'validate' in opts ? opts.validate : defaults.validate;
    this.truncate = 'truncate' in opts ? opts.truncate : defaults.truncate;
    this.className = 'className' in opts ? opts.className : defaults.className;
    this.attributes = opts.attributes || defaults.attributes;
    this.ignoreTags = [];
    var ignoredTags = 'ignoreTags' in opts ? opts.ignoreTags : defaults.ignoreTags;
    for (var i = 0; i < ignoredTags.length; i++) {
      this.ignoreTags.push(ignoredTags[i].toUpperCase());
    }
  }
  Options.prototype = {
    resolve: function resolve(token) {
      var href = token.toHref(this.defaultProtocol);
      return {
        formatted: this.get('format', token.toString(), token),
        formattedHref: this.get('formatHref', href, token),
        tagName: this.get('tagName', href, token),
        className: this.get('className', href, token),
        target: this.get('target', href, token),
        rel: this.get('rel', href, token),
        events: this.getObject('events', href, token),
        attributes: this.getObject('attributes', href, token),
        truncate: this.get('truncate', href, token)
      };
    },
    check: function check(token) {
      return this.get('validate', token.toString(), token);
    },
    get: function get(key, operator, token) {
      var option = this[key];
      if (!option) {
        return option;
      }
      var optionValue;
      switch (_typeof(option)) {
        case 'function':
          return option(operator, token.t);
        case 'object':
          optionValue = token.t in option ? option[token.t] : defaults[key];
          return typeof optionValue === 'function' ? optionValue(operator, token.t) : optionValue;
      }
      return option;
    },
    getObject: function getObject(key, operator, token) {
      var option = this[key];
      return typeof option === 'function' ? option(operator, token.t) : option;
    }
  };
  function noop(val) {
    return val;
  }
  Object.freeze({
  	__proto__: null,
  	defaults: defaults,
  	Options: Options
  });
  function inherits(parent, child) {
    var props = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var extended = Object.create(parent.prototype);
    for (var p in props) {
      extended[p] = props[p];
    }
    extended.constructor = child;
    child.prototype = extended;
    return child;
  }
  function MultiToken() {}
  MultiToken.prototype = {
    t: 'token',
    isLink: false,
    toString: function toString() {
      return this.v;
    },
    toHref: function toHref() {
      return this.toString();
    },
    startIndex: function startIndex() {
      return this.tk[0].s;
    },
    endIndex: function endIndex() {
      return this.tk[this.tk.length - 1].e;
    },
    toObject: function toObject() {
      var protocol = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaults.defaultProtocol;
      return {
        type: this.t,
        value: this.v,
        isLink: this.isLink,
        href: this.toHref(protocol),
        start: this.startIndex(),
        end: this.endIndex()
      };
    }
  };
  function createTokenClass(type, props) {
    function Token(value, tokens) {
      this.t = type;
      this.v = value;
      this.tk = tokens;
    }
    inherits(MultiToken, Token, props);
    return Token;
  }
  var MailtoEmail = createTokenClass('email', {
    isLink: true
  });
  var Email = createTokenClass('email', {
    isLink: true,
    toHref: function toHref() {
      return 'mailto:' + this.toString();
    }
  });
  var Text = createTokenClass('text');
  var Nl = createTokenClass('nl');
  var Url = createTokenClass('url', {
    isLink: true,
    toHref: function toHref() {
      var protocol = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaults.defaultProtocol;
      var tokens = this.tk;
      var hasProtocol = false;
      var hasSlashSlash = false;
      var result = [];
      var i = 0;
      while (tokens[i].t === PROTOCOL) {
        hasProtocol = true;
        result.push(tokens[i].v);
        i++;
      }
      while (tokens[i].t === SLASH) {
        hasSlashSlash = true;
        result.push(tokens[i].v);
        i++;
      }
      for (; i < tokens.length; i++) {
        result.push(tokens[i].v);
      }
      result = result.join('');
      if (!(hasProtocol || hasSlashSlash)) {
        result = "".concat(protocol, "://").concat(result);
      }
      return result;
    },
    hasProtocol: function hasProtocol() {
      return this.tk[0].t === PROTOCOL;
    }
  });
  var multi = Object.freeze({
  	__proto__: null,
  	MultiToken: MultiToken,
  	Base: MultiToken,
  	createTokenClass: createTokenClass,
  	MailtoEmail: MailtoEmail,
  	Email: Email,
  	Text: Text,
  	Nl: Nl,
  	Url: Url
  });
  function init$1() {
    var S_START = makeState();
    var S_PROTOCOL = makeState();
    var S_MAILTO = makeState();
    var S_PROTOCOL_SLASH = makeState();
    var S_PROTOCOL_SLASH_SLASH = makeState();
    var S_DOMAIN = makeState();
    var S_DOMAIN_DOT = makeState();
    var S_TLD = makeAcceptingState(Url);
    var S_TLD_COLON = makeState();
    var S_TLD_PORT = makeAcceptingState(Url);
    var S_URL = makeAcceptingState(Url);
    var S_URL_NON_ACCEPTING = makeState();
    var S_URL_OPENBRACE = makeState();
    var S_URL_OPENBRACKET = makeState();
    var S_URL_OPENANGLEBRACKET = makeState();
    var S_URL_OPENPAREN = makeState();
    var S_URL_OPENBRACE_Q = makeAcceptingState(Url);
    var S_URL_OPENBRACKET_Q = makeAcceptingState(Url);
    var S_URL_OPENANGLEBRACKET_Q = makeAcceptingState(Url);
    var S_URL_OPENPAREN_Q = makeAcceptingState(Url);
    var S_URL_OPENBRACE_SYMS = makeState();
    var S_URL_OPENBRACKET_SYMS = makeState();
    var S_URL_OPENANGLEBRACKET_SYMS = makeState();
    var S_URL_OPENPAREN_SYMS = makeState();
    var S_EMAIL_DOMAIN = makeState();
    var S_EMAIL_DOMAIN_DOT = makeState();
    var S_EMAIL = makeAcceptingState(Email);
    var S_EMAIL_COLON = makeState();
    var S_EMAIL_PORT = makeAcceptingState(Email);
    var S_MAILTO_EMAIL = makeAcceptingState(MailtoEmail);
    var S_MAILTO_EMAIL_NON_ACCEPTING = makeState();
    var S_LOCALPART = makeState();
    var S_LOCALPART_AT = makeState();
    var S_LOCALPART_DOT = makeState();
    var S_NL = makeAcceptingState(Nl);
    makeT(S_START, NL, S_NL);
    makeT(S_START, PROTOCOL, S_PROTOCOL);
    makeT(S_START, MAILTO, S_MAILTO);
    makeT(S_PROTOCOL, SLASH, S_PROTOCOL_SLASH);
    makeT(S_PROTOCOL_SLASH, SLASH, S_PROTOCOL_SLASH_SLASH);
    makeT(S_START, TLD, S_DOMAIN);
    makeT(S_START, DOMAIN, S_DOMAIN);
    makeT(S_START, LOCALHOST, S_TLD);
    makeT(S_START, NUM, S_DOMAIN);
    makeT(S_PROTOCOL_SLASH_SLASH, TLD, S_URL);
    makeT(S_PROTOCOL_SLASH_SLASH, DOMAIN, S_URL);
    makeT(S_PROTOCOL_SLASH_SLASH, NUM, S_URL);
    makeT(S_PROTOCOL_SLASH_SLASH, LOCALHOST, S_URL);
    makeT(S_DOMAIN, DOT, S_DOMAIN_DOT);
    makeT(S_EMAIL_DOMAIN, DOT, S_EMAIL_DOMAIN_DOT);
    makeT(S_DOMAIN_DOT, TLD, S_TLD);
    makeT(S_DOMAIN_DOT, DOMAIN, S_DOMAIN);
    makeT(S_DOMAIN_DOT, NUM, S_DOMAIN);
    makeT(S_DOMAIN_DOT, LOCALHOST, S_DOMAIN);
    makeT(S_EMAIL_DOMAIN_DOT, TLD, S_EMAIL);
    makeT(S_EMAIL_DOMAIN_DOT, DOMAIN, S_EMAIL_DOMAIN);
    makeT(S_EMAIL_DOMAIN_DOT, NUM, S_EMAIL_DOMAIN);
    makeT(S_EMAIL_DOMAIN_DOT, LOCALHOST, S_EMAIL_DOMAIN);
    makeT(S_TLD, DOT, S_DOMAIN_DOT);
    makeT(S_EMAIL, DOT, S_EMAIL_DOMAIN_DOT);
    makeT(S_TLD, COLON, S_TLD_COLON);
    makeT(S_TLD, SLASH, S_URL);
    makeT(S_TLD_COLON, NUM, S_TLD_PORT);
    makeT(S_TLD_PORT, SLASH, S_URL);
    makeT(S_EMAIL, COLON, S_EMAIL_COLON);
    makeT(S_EMAIL_COLON, NUM, S_EMAIL_PORT);
    var qsAccepting = [AMPERSAND, ASTERISK, AT, BACKSLASH, BACKTICK, CARET, DOLLAR, DOMAIN, EQUALS, HYPHEN, LOCALHOST, NUM, PERCENT, PIPE, PLUS, POUND, PROTOCOL, SLASH, SYM, TILDE, TLD, UNDERSCORE];
    var qsNonAccepting = [APOSTROPHE, CLOSEANGLEBRACKET, CLOSEBRACE, CLOSEBRACKET, CLOSEPAREN, COLON, COMMA, DOT, EXCLAMATION, OPENANGLEBRACKET, OPENBRACE, OPENBRACKET, OPENPAREN, QUERY, QUOTE, SEMI];
    makeT(S_URL, OPENBRACE, S_URL_OPENBRACE);
    makeT(S_URL, OPENBRACKET, S_URL_OPENBRACKET);
    makeT(S_URL, OPENANGLEBRACKET, S_URL_OPENANGLEBRACKET);
    makeT(S_URL, OPENPAREN, S_URL_OPENPAREN);
    makeT(S_URL_NON_ACCEPTING, OPENBRACE, S_URL_OPENBRACE);
    makeT(S_URL_NON_ACCEPTING, OPENBRACKET, S_URL_OPENBRACKET);
    makeT(S_URL_NON_ACCEPTING, OPENANGLEBRACKET, S_URL_OPENANGLEBRACKET);
    makeT(S_URL_NON_ACCEPTING, OPENPAREN, S_URL_OPENPAREN);
    makeT(S_URL_OPENBRACE, CLOSEBRACE, S_URL);
    makeT(S_URL_OPENBRACKET, CLOSEBRACKET, S_URL);
    makeT(S_URL_OPENANGLEBRACKET, CLOSEANGLEBRACKET, S_URL);
    makeT(S_URL_OPENPAREN, CLOSEPAREN, S_URL);
    makeT(S_URL_OPENBRACE_Q, CLOSEBRACE, S_URL);
    makeT(S_URL_OPENBRACKET_Q, CLOSEBRACKET, S_URL);
    makeT(S_URL_OPENANGLEBRACKET_Q, CLOSEANGLEBRACKET, S_URL);
    makeT(S_URL_OPENPAREN_Q, CLOSEPAREN, S_URL);
    makeT(S_URL_OPENBRACE_SYMS, CLOSEBRACE, S_URL);
    makeT(S_URL_OPENBRACKET_SYMS, CLOSEBRACKET, S_URL);
    makeT(S_URL_OPENANGLEBRACKET_SYMS, CLOSEANGLEBRACKET, S_URL);
    makeT(S_URL_OPENPAREN_SYMS, CLOSEPAREN, S_URL);
    makeMultiT(S_URL_OPENBRACE, qsAccepting, S_URL_OPENBRACE_Q);
    makeMultiT(S_URL_OPENBRACKET, qsAccepting, S_URL_OPENBRACKET_Q);
    makeMultiT(S_URL_OPENANGLEBRACKET, qsAccepting, S_URL_OPENANGLEBRACKET_Q);
    makeMultiT(S_URL_OPENPAREN, qsAccepting, S_URL_OPENPAREN_Q);
    makeMultiT(S_URL_OPENBRACE, qsNonAccepting, S_URL_OPENBRACE_SYMS);
    makeMultiT(S_URL_OPENBRACKET, qsNonAccepting, S_URL_OPENBRACKET_SYMS);
    makeMultiT(S_URL_OPENANGLEBRACKET, qsNonAccepting, S_URL_OPENANGLEBRACKET_SYMS);
    makeMultiT(S_URL_OPENPAREN, qsNonAccepting, S_URL_OPENPAREN_SYMS);
    makeMultiT(S_URL_OPENBRACE_Q, qsAccepting, S_URL_OPENBRACE_Q);
    makeMultiT(S_URL_OPENBRACKET_Q, qsAccepting, S_URL_OPENBRACKET_Q);
    makeMultiT(S_URL_OPENANGLEBRACKET_Q, qsAccepting, S_URL_OPENANGLEBRACKET_Q);
    makeMultiT(S_URL_OPENPAREN_Q, qsAccepting, S_URL_OPENPAREN_Q);
    makeMultiT(S_URL_OPENBRACE_Q, qsNonAccepting, S_URL_OPENBRACE_Q);
    makeMultiT(S_URL_OPENBRACKET_Q, qsNonAccepting, S_URL_OPENBRACKET_Q);
    makeMultiT(S_URL_OPENANGLEBRACKET_Q, qsNonAccepting, S_URL_OPENANGLEBRACKET_Q);
    makeMultiT(S_URL_OPENPAREN_Q, qsNonAccepting, S_URL_OPENPAREN_Q);
    makeMultiT(S_URL_OPENBRACE_SYMS, qsAccepting, S_URL_OPENBRACE_Q);
    makeMultiT(S_URL_OPENBRACKET_SYMS, qsAccepting, S_URL_OPENBRACKET_Q);
    makeMultiT(S_URL_OPENANGLEBRACKET_SYMS, qsAccepting, S_URL_OPENANGLEBRACKET_Q);
    makeMultiT(S_URL_OPENPAREN_SYMS, qsAccepting, S_URL_OPENPAREN_Q);
    makeMultiT(S_URL_OPENBRACE_SYMS, qsNonAccepting, S_URL_OPENBRACE_SYMS);
    makeMultiT(S_URL_OPENBRACKET_SYMS, qsNonAccepting, S_URL_OPENBRACKET_SYMS);
    makeMultiT(S_URL_OPENANGLEBRACKET_SYMS, qsNonAccepting, S_URL_OPENANGLEBRACKET_SYMS);
    makeMultiT(S_URL_OPENPAREN_SYMS, qsNonAccepting, S_URL_OPENPAREN_SYMS);
    makeMultiT(S_URL, qsAccepting, S_URL);
    makeMultiT(S_URL_NON_ACCEPTING, qsAccepting, S_URL);
    makeMultiT(S_URL, qsNonAccepting, S_URL_NON_ACCEPTING);
    makeMultiT(S_URL_NON_ACCEPTING, qsNonAccepting, S_URL_NON_ACCEPTING);
    makeT(S_MAILTO, TLD, S_MAILTO_EMAIL);
    makeT(S_MAILTO, DOMAIN, S_MAILTO_EMAIL);
    makeT(S_MAILTO, NUM, S_MAILTO_EMAIL);
    makeT(S_MAILTO, LOCALHOST, S_MAILTO_EMAIL);
    makeMultiT(S_MAILTO_EMAIL, qsAccepting, S_MAILTO_EMAIL);
    makeMultiT(S_MAILTO_EMAIL, qsNonAccepting, S_MAILTO_EMAIL_NON_ACCEPTING);
    makeMultiT(S_MAILTO_EMAIL_NON_ACCEPTING, qsAccepting, S_MAILTO_EMAIL);
    makeMultiT(S_MAILTO_EMAIL_NON_ACCEPTING, qsNonAccepting, S_MAILTO_EMAIL_NON_ACCEPTING);
    var localpartAccepting = [AMPERSAND, APOSTROPHE, ASTERISK, BACKSLASH, BACKTICK, CARET, CLOSEBRACE, DOLLAR, DOMAIN, EQUALS, HYPHEN, NUM, OPENBRACE, PERCENT, PIPE, PLUS, POUND, QUERY, SLASH, SYM, TILDE, TLD, UNDERSCORE];
    makeMultiT(S_DOMAIN, localpartAccepting, S_LOCALPART);
    makeT(S_DOMAIN, AT, S_LOCALPART_AT);
    makeMultiT(S_TLD, localpartAccepting, S_LOCALPART);
    makeT(S_TLD, AT, S_LOCALPART_AT);
    makeMultiT(S_DOMAIN_DOT, localpartAccepting, S_LOCALPART);
    makeMultiT(S_LOCALPART, localpartAccepting, S_LOCALPART);
    makeT(S_LOCALPART, AT, S_LOCALPART_AT);
    makeT(S_LOCALPART, DOT, S_LOCALPART_DOT);
    makeMultiT(S_LOCALPART_DOT, localpartAccepting, S_LOCALPART);
    makeT(S_LOCALPART_AT, TLD, S_EMAIL_DOMAIN);
    makeT(S_LOCALPART_AT, DOMAIN, S_EMAIL_DOMAIN);
    makeT(S_LOCALPART_AT, NUM, S_EMAIL_DOMAIN);
    makeT(S_LOCALPART_AT, LOCALHOST, S_EMAIL);
    return S_START;
  }
  function run(start, input, tokens) {
    var len = tokens.length;
    var cursor = 0;
    var multis = [];
    var textTokens = [];
    while (cursor < len) {
      var state = start;
      var secondState = null;
      var nextState = null;
      var multiLength = 0;
      var latestAccepting = null;
      var sinceAccepts = -1;
      while (cursor < len && !(secondState = takeT(state, tokens[cursor].t))) {
        textTokens.push(tokens[cursor++]);
      }
      while (cursor < len && (nextState = secondState || takeT(state, tokens[cursor].t))) {
        secondState = null;
        state = nextState;
        if (state.accepts()) {
          sinceAccepts = 0;
          latestAccepting = state;
        } else if (sinceAccepts >= 0) {
          sinceAccepts++;
        }
        cursor++;
        multiLength++;
      }
      if (sinceAccepts < 0) {
        for (var i = cursor - multiLength; i < cursor; i++) {
          textTokens.push(tokens[i]);
        }
      } else {
        if (textTokens.length > 0) {
          multis.push(parserCreateMultiToken(Text, input, textTokens));
          textTokens = [];
        }
        cursor -= sinceAccepts;
        multiLength -= sinceAccepts;
        var Multi = latestAccepting.t;
        var subtokens = tokens.slice(cursor - multiLength, cursor);
        multis.push(parserCreateMultiToken(Multi, input, subtokens));
      }
    }
    if (textTokens.length > 0) {
      multis.push(parserCreateMultiToken(Text, input, textTokens));
    }
    return multis;
  }
  function parserCreateMultiToken(Multi, input, tokens) {
    var startIdx = tokens[0].s;
    var endIdx = tokens[tokens.length - 1].e;
    var value = input.substr(startIdx, endIdx - startIdx);
    return new Multi(value, tokens);
  }
  var INIT = {
    scanner: null,
    parser: null,
    pluginQueue: [],
    customProtocols: [],
    initialized: false
  };
  function init() {
    INIT.scanner = {
      start: init$2(INIT.customProtocols),
      tokens: text
    };
    INIT.parser = {
      start: init$1(),
      tokens: multi
    };
    var utils = {
      createTokenClass: createTokenClass
    };
    for (var i = 0; i < INIT.pluginQueue.length; i++) {
      INIT.pluginQueue[i][1]({
        scanner: INIT.scanner,
        parser: INIT.parser,
        utils: utils
      });
    }
    INIT.initialized = true;
  }
  function tokenize(str) {
    if (!INIT.initialized) {
      init();
    }
    return run(INIT.parser.start, str, run$1(INIT.scanner.start, str));
  }
  function find(str) {
    var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var tokens = tokenize(str);
    var filtered = [];
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      if (token.isLink && (!type || token.t === type)) {
        filtered.push(token.toObject());
      }
    }
    return filtered;
  }
  function test(str) {
    var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var tokens = tokenize(str);
    return tokens.length === 1 && tokens[0].isLink && (!type || tokens[0].t === type);
  }

  function autolink(options) {
      return new Plugin({
          key: new PluginKey('autolink'),
          appendTransaction: (transactions, oldState, newState) => {
              const docChanges = transactions.some(transaction => transaction.docChanged)
                  && !oldState.doc.eq(newState.doc);
              const preventAutolink = transactions.some(transaction => transaction.getMeta('preventAutolink'));
              if (!docChanges || preventAutolink) {
                  return;
              }
              const { tr } = newState;
              const transform = combineTransactionSteps(oldState.doc, transactions);
              const { mapping } = transform;
              const changes = getChangedRanges(transform);
              changes.forEach(({ oldRange, newRange }) => {
                  getMarksBetween(oldRange.from, oldRange.to, oldState.doc)
                      .filter(item => item.mark.type === options.type)
                      .forEach(oldMark => {
                      const newFrom = mapping.map(oldMark.from);
                      const newTo = mapping.map(oldMark.to);
                      const newMarks = getMarksBetween(newFrom, newTo, newState.doc)
                          .filter(item => item.mark.type === options.type);
                      if (!newMarks.length) {
                          return;
                      }
                      const newMark = newMarks[0];
                      const oldLinkText = oldState.doc.textBetween(oldMark.from, oldMark.to, undefined, ' ');
                      const newLinkText = newState.doc.textBetween(newMark.from, newMark.to, undefined, ' ');
                      const wasLink = test(oldLinkText);
                      const isLink = test(newLinkText);
                      if (wasLink && !isLink) {
                          tr.removeMark(newMark.from, newMark.to, options.type);
                      }
                  });
                  findChildrenInRange(newState.doc, newRange, node => node.isTextblock)
                      .forEach(textBlock => {
                      const text = newState.doc.textBetween(textBlock.pos, textBlock.pos + textBlock.node.nodeSize, undefined, ' ');
                      find(text)
                          .filter(link => link.isLink)
                          .map(link => ({
                          ...link,
                          from: textBlock.pos + link.start + 1,
                          to: textBlock.pos + link.end + 1,
                      }))
                          .filter(link => {
                          const fromIsInRange = newRange.from >= link.from && newRange.from <= link.to;
                          const toIsInRange = newRange.to >= link.from && newRange.to <= link.to;
                          return fromIsInRange || toIsInRange;
                      })
                          .forEach(link => {
                          tr.addMark(link.from, link.to, options.type.create({
                              href: link.href,
                          }));
                      });
                  });
              });
              if (!tr.steps.length) {
                  return;
              }
              return tr;
          },
      });
  }
  function clickHandler(options) {
      return new Plugin({
          key: new PluginKey('handleClickLink'),
          props: {
              handleClick: (view, pos, event) => {
                  var _a;
                  const attrs = getAttributes(view.state, options.type.name);
                  const link = (_a = event.target) === null || _a === void 0 ? void 0 : _a.closest('a');
                  if (link && attrs.href) {
                      window.open(attrs.href, attrs.target);
                      return true;
                  }
                  return false;
              },
          },
      });
  }
  function pasteHandler(options) {
      return new Plugin({
          key: new PluginKey('handlePasteLink'),
          props: {
              handlePaste: (view, event, slice) => {
                  const { state } = view;
                  const { selection } = state;
                  const { empty } = selection;
                  if (empty) {
                      return false;
                  }
                  let textContent = '';
                  slice.content.forEach(node => {
                      textContent += node.textContent;
                  });
                  const link = find(textContent).find(item => item.isLink && item.value === textContent);
                  if (!textContent || !link) {
                      return false;
                  }
                  options.editor.commands.setMark(options.type, {
                      href: link.href,
                  });
                  return true;
              },
          },
      });
  }
  const Link = Mark.create({
      name: 'link',
      priority: 1000,
      keepOnSplit: false,
      inclusive() {
          return this.options.autolink;
      },
      addOptions() {
          return {
              openOnClick: true,
              linkOnPaste: true,
              autolink: true,
              HTMLAttributes: {
                  target: '_blank',
                  rel: 'noopener noreferrer nofollow',
              },
          };
      },
      addAttributes() {
          return {
              href: {
                  default: null,
              },
              target: {
                  default: this.options.HTMLAttributes.target,
              },
          };
      },
      parseHTML() {
          return [
              { tag: 'a[href]' },
          ];
      },
      renderHTML({ HTMLAttributes }) {
          return [
              'a',
              mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
              0,
          ];
      },
      addCommands() {
          return {
              setLink: attributes => ({ chain }) => {
                  return chain()
                      .setMark(this.name, attributes)
                      .setMeta('preventAutolink', true)
                      .run();
              },
              toggleLink: attributes => ({ chain }) => {
                  return chain()
                      .toggleMark(this.name, attributes, { extendEmptyMarkRange: true })
                      .setMeta('preventAutolink', true)
                      .run();
              },
              unsetLink: () => ({ chain }) => {
                  return chain()
                      .unsetMark(this.name, { extendEmptyMarkRange: true })
                      .setMeta('preventAutolink', true)
                      .run();
              },
          };
      },
      addPasteRules() {
          return [
              markPasteRule({
                  find: text => find(text)
                      .filter(link => link.isLink)
                      .map(link => ({
                      text: link.value,
                      index: link.start,
                      data: link,
                  })),
                  type: this.type,
                  getAttributes: match => {
                      var _a;
                      return ({
                          href: (_a = match.data) === null || _a === void 0 ? void 0 : _a.href,
                      });
                  },
              }),
          ];
      },
      addProseMirrorPlugins() {
          const plugins = [];
          if (this.options.autolink) {
              plugins.push(autolink({
                  type: this.type,
              }));
          }
          if (this.options.openOnClick) {
              plugins.push(clickHandler({
                  type: this.type,
              }));
          }
          if (this.options.linkOnPaste) {
              plugins.push(pasteHandler({
                  editor: this.editor,
                  type: this.type,
              }));
          }
          return plugins;
      },
  });

  function dropCursor(options) {
    if ( options === void 0 ) options = {};
    return new Plugin({
      view: function view(editorView) { return new DropCursorView(editorView, options) }
    })
  }
  var DropCursorView = function DropCursorView(editorView, options) {
    var this$1$1 = this;
    this.editorView = editorView;
    this.width = options.width || 1;
    this.color = options.color || "black";
    this.class = options.class;
    this.cursorPos = null;
    this.element = null;
    this.timeout = null;
    this.handlers = ["dragover", "dragend", "drop", "dragleave"].map(function (name) {
      var handler = function (e) { return this$1$1[name](e); };
      editorView.dom.addEventListener(name, handler);
      return {name: name, handler: handler}
    });
  };
  DropCursorView.prototype.destroy = function destroy () {
      var this$1$1 = this;
    this.handlers.forEach(function (ref) {
        var name = ref.name;
        var handler = ref.handler;
        return this$1$1.editorView.dom.removeEventListener(name, handler);
      });
  };
  DropCursorView.prototype.update = function update (editorView, prevState) {
    if (this.cursorPos != null && prevState.doc != editorView.state.doc) {
      if (this.cursorPos > editorView.state.doc.content.size) { this.setCursor(null); }
      else { this.updateOverlay(); }
    }
  };
  DropCursorView.prototype.setCursor = function setCursor (pos) {
    if (pos == this.cursorPos) { return }
    this.cursorPos = pos;
    if (pos == null) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    } else {
      this.updateOverlay();
    }
  };
  DropCursorView.prototype.updateOverlay = function updateOverlay () {
    var $pos = this.editorView.state.doc.resolve(this.cursorPos), rect;
    if (!$pos.parent.inlineContent) {
      var before = $pos.nodeBefore, after = $pos.nodeAfter;
      if (before || after) {
        var nodeRect = this.editorView.nodeDOM(this.cursorPos - (before ?before.nodeSize : 0)).getBoundingClientRect();
        var top = before ? nodeRect.bottom : nodeRect.top;
        if (before && after)
          { top = (top + this.editorView.nodeDOM(this.cursorPos).getBoundingClientRect().top) / 2; }
        rect = {left: nodeRect.left, right: nodeRect.right, top: top - this.width / 2, bottom: top + this.width / 2};
      }
    }
    if (!rect) {
      var coords = this.editorView.coordsAtPos(this.cursorPos);
      rect = {left: coords.left - this.width / 2, right: coords.left + this.width / 2, top: coords.top, bottom: coords.bottom};
    }
    var parent = this.editorView.dom.offsetParent;
    if (!this.element) {
      this.element = parent.appendChild(document.createElement("div"));
      if (this.class) { this.element.className = this.class; }
      this.element.style.cssText = "position: absolute; z-index: 50; pointer-events: none; background-color: " + this.color;
    }
    var parentLeft, parentTop;
    if (!parent || parent == document.body && getComputedStyle(parent).position == "static") {
      parentLeft = -pageXOffset;
      parentTop = -pageYOffset;
    } else {
      var rect$1 = parent.getBoundingClientRect();
      parentLeft = rect$1.left - parent.scrollLeft;
      parentTop = rect$1.top - parent.scrollTop;
    }
    this.element.style.left = (rect.left - parentLeft) + "px";
    this.element.style.top = (rect.top - parentTop) + "px";
    this.element.style.width = (rect.right - rect.left) + "px";
    this.element.style.height = (rect.bottom - rect.top) + "px";
  };
  DropCursorView.prototype.scheduleRemoval = function scheduleRemoval (timeout) {
      var this$1$1 = this;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(function () { return this$1$1.setCursor(null); }, timeout);
  };
  DropCursorView.prototype.dragover = function dragover (event) {
    if (!this.editorView.editable) { return }
    var pos = this.editorView.posAtCoords({left: event.clientX, top: event.clientY});
    var node = pos && pos.inside >= 0 && this.editorView.state.doc.nodeAt(pos.inside);
    var disableDropCursor = node && node.type.spec.disableDropCursor;
    var disabled = typeof disableDropCursor == "function" ? disableDropCursor(this.editorView, pos) : disableDropCursor;
    if (pos && !disabled) {
      var target = pos.pos;
      if (this.editorView.dragging && this.editorView.dragging.slice) {
        target = dropPoint(this.editorView.state.doc, target, this.editorView.dragging.slice);
        if (target == null) { return this.setCursor(null) }
      }
      this.setCursor(target);
      this.scheduleRemoval(5000);
    }
  };
  DropCursorView.prototype.dragend = function dragend () {
    this.scheduleRemoval(20);
  };
  DropCursorView.prototype.drop = function drop () {
    this.scheduleRemoval(20);
  };
  DropCursorView.prototype.dragleave = function dragleave (event) {
    if (event.target == this.editorView.dom || !this.editorView.dom.contains(event.relatedTarget))
      { this.setCursor(null); }
  };

  const Dropcursor = Extension.create({
      name: 'dropCursor',
      addOptions() {
          return {
              color: 'currentColor',
              width: 1,
              class: null,
          };
      },
      addProseMirrorPlugins() {
          return [
              dropCursor(this.options),
          ];
      },
  });

  exports.Blockquote = Blockquote;
  exports.Bold = Bold;
  exports.BulletList = BulletList;
  exports.Code = Code;
  exports.CodeBlock = CodeBlock;
  exports.Color = Color;
  exports.CommandManager = CommandManager;
  exports.Document = Document;
  exports.Dropcursor = Dropcursor;
  exports.Editor = Editor;
  exports.Extension = Extension;
  exports.Heading = Heading;
  exports.Image = Image;
  exports.InputRule = InputRule;
  exports.Italic = Italic;
  exports.Link = Link;
  exports.ListItem = ListItem;
  exports.Mark = Mark;
  exports.Node = Node;
  exports.NodeView = NodeView;
  exports.OrderedList = OrderedList;
  exports.Paragraph = Paragraph;
  exports.PasteRule = PasteRule;
  exports.Text = Text$1;
  exports.TextStyle = TextStyle;
  exports.Tracker = Tracker;
  exports.Underline = Underline;
  exports.backtickInputRegex = backtickInputRegex;
  exports.callOrReturn = callOrReturn;
  exports.combineTransactionSteps = combineTransactionSteps;
  exports.defaultBlockAt = defaultBlockAt;
  exports.escapeForRegEx = escapeForRegEx;
  exports.extensions = extensions;
  exports.findChildren = findChildren;
  exports.findChildrenInRange = findChildrenInRange;
  exports.findParentNode = findParentNode;
  exports.findParentNodeClosestToPos = findParentNodeClosestToPos;
  exports.generateHTML = generateHTML;
  exports.generateJSON = generateJSON;
  exports.generateText = generateText;
  exports.getAttributes = getAttributes;
  exports.getChangedRanges = getChangedRanges;
  exports.getDebugJSON = getDebugJSON;
  exports.getExtensionField = getExtensionField;
  exports.getHTMLFromFragment = getHTMLFromFragment;
  exports.getMarkAttributes = getMarkAttributes;
  exports.getMarkRange = getMarkRange;
  exports.getMarkType = getMarkType;
  exports.getMarksBetween = getMarksBetween;
  exports.getNodeAttributes = getNodeAttributes;
  exports.getNodeType = getNodeType;
  exports.getSchema = getSchema;
  exports.getText = getText;
  exports.getTextBetween = getTextBetween;
  exports.inputRulesPlugin = inputRulesPlugin;
  exports.isActive = isActive;
  exports.isList = isList;
  exports.isMarkActive = isMarkActive;
  exports.isNodeActive = isNodeActive;
  exports.isNodeEmpty = isNodeEmpty;
  exports.isNodeSelection = isNodeSelection;
  exports.isTextSelection = isTextSelection;
  exports.markInputRule = markInputRule;
  exports.markPasteRule = markPasteRule;
  exports.mergeAttributes = mergeAttributes;
  exports.nodeInputRule = nodeInputRule;
  exports.pasteRegex = pasteRegex;
  exports.pasteRulesPlugin = pasteRulesPlugin;
  exports.posToDOMRect = posToDOMRect;
  exports.textInputRule = textInputRule;
  exports.textPasteRule = textPasteRule;
  exports.textblockTypeInputRule = textblockTypeInputRule;
  exports.tildeInputRegex = tildeInputRegex;
  exports.wrappingInputRule = wrappingInputRule;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
