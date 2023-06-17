/*
  dom.lib.js
  Jason M. Knight
  January 2023
  
  REQUIRES
    nothing
  POLLUTES
    document, Element.prototype, Object.prototype
  EVENTS
    window load, keypress
  
  My baseline helper functions. This is about as
  close to a "framework" as I typically would get. 
  
  YES, I extend system objects. Bite me.
*/

{ // scope isolating block
  
  const
  
    isNodeOrNonObject = (obj) => (
      ("object" !== typeof obj) ||
      (obj instanceof Node)
    ); // isNodeOrNonObject
    
  Object.defineProperties(document, {
  
    __make : { value : (tagName, ...rest) => {
      let e = document.createElement(tagName);
      if (rest.length) e.__attach(...rest);
      return e;
    } }, // document.__make
    
    __makeModal : { value : (tagName, id, title, ...children) => {
      const div = document.__make(
        "div", 
        [
          "h2", 
          [ "a",
            { hidden : true, href : "#" },
            [ "span", "Close Modal" ]
          ],
          title
        ],
        ...children
      );
      document.body.__make(
        tagName,
        { id, className : "modal" },
        [ 
          "a",
          { hidden : true, href : "#", tabindex : "-1" },
          [ "span", "Close Modal" ]
        ],
        div
      );
      return div;
    } } // document.__makeModal
    
  }); // document extensions
  
  Object.defineProperties(Element.prototype, {
  
    __attach : { value : function(...rest) {
      for (let arg of rest) {
        if (arg !== undefined) {
          if (arg instanceof Array) this.__make(...arg);
          else if (isNodeOrNonObject(arg)) this.append(arg);
          else {
						if (arg.dataset) {
							Object.assign(this.dataset, arg.dataSet);
							delete arg.dataset;
						}
            if (arg.placement) {
              this.dataset.__domMakePlacement = String(arg.placement).toLowerCase();
              delete arg.placement;
            }
            if (arg.style) {
              Object.assign(this.style, arg.style);
              delete arg.style;
            }
            Object.assign(this, arg);
          }
        }
      }
      return this;
    } }, // Element.prototype.__attach
     
    __make : { value : function(tagName, ...rest) {
      let e = document.__make(tagName, ...rest);
      this.insertAdjacentElement(e.dataset.__domMakePlacement || "beforeend", e);
      delete e.dataset.__domMakePlacement;
      return e;
    } } // Element.prototype.__make
    
  } ); // Element Extensions
  
  Object.defineProperty(Object.prototype, "__getPrevNext", {
    value : function(name) {
      const
        keys = Object.keys(this),
        nameIndex = keys.indexOf(name);
      return nameIndex >= 0 ? {
        prev : keys[nameIndex - 1],
        next : keys[nameIndex + 1]
      } : {
        prev : undefined,
        next : undefined
      };
    }
  } ); // Object.prototype.__getPrevNext
  
  addEventListener("keypress", (e) => {
    if ((location.hash.length < 2) || (e.key !== "Escape")) return;
    const target = document.getElementById(location.hash.substr(1));
    if (target && target.classList.contains("modal")) location.hash = "#";
  } );

  /* bizarre chrome fix */
  if (location.hash.length > 1) {
    const hash = location.hash;
    location.hash = "";
    addEventListener("load", () => { location.hash = hash; });
  }
    
} // end scope isolation