module.exports = {

  sanityCheck: function(data) {
    for(var d in data) {
      if(data[d] === "undefined") {
        return false;
      }
    }
    return true;
  }
}