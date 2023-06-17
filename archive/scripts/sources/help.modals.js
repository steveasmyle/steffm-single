/*
  help.modals.js
  Jason M. Knight
  January 2023
  
  REQUIRES
    dom.lib.js
  POLLUTES
    nothing
  EVENTS
    none
  
  Generates the help pages for our calculator
*/

{
  
  const
  
    buttonDocs = {
      
      memory : {
        caption : "Memory",
        buttons : [
          {
            kbd : "Del",
            samp : "MC",
            desc : "Memory Clear"
          }, {
            kbd : "PgUp",
            samp : "M+",
            desc : "Memory Add"
          }, {
            kbd : "PgDn",
            samp : "M-",
            desc : "Memory Subtract"
          }, {
            kbd : "Ins",
            samp : "MR",
            desc : "Memory Subtract"
          }
        ]
      }, // buttonDocs.memory
      
      commands : {
        caption : "Commands",
        buttons : [
          {
            kbd : "T",
            samp : "VT",
            sampClass : "view",
            desc : "View Total"
          }, {
            kbd : "E",
            samp : "VE",
            sampClass : "view",
            desc : "View Entry"
          }, {
            kbd : "Esc",
            samp : "C",
            sampClass : "clear",
            desc : "Clear All"
          }, {
            kbd : "Backspace",
            kbdClass : "wide",
            samp : "CE",
            sampClass : "clearEntry",
            desc : "Clear Entry"
          }, {
            kbd : "F1",
            samp : "?",
            desc : "This Help Screen"
          }
        ]
      }, // buttonDocs.commands
              
      modifiers : {
        caption : "Modifiers",
        buttons : [
          {
            kbd : "S",
            samp : "\u221A",
            desc : "Square Root"
          }, {
            kbd : "N",
            samp : "\u00B1",
            desc : "Negate (inverst sign)"
          }, {
            kbd : ["P", "%"],
            samp : "%",
            desc : "Percent (divide by 100)"
          }
        ]
      }, // buttonDocs.modifiers
      
      operators : {
        caption : "Operators",
        buttons : [
          {
            kbd : "/",
            samp : "\u00F7",
            desc : "Divide"
          }, {
            kbd : ["*", "X" ],
            samp : "X",
            desc : "Multiply"
          }, {
            kbd : "-",
            samp : "-",
            desc : "Subtract"
          }, {
            kbd : "+",
            samp : "+",
            desc : "Add"
          }, {
            kbd : [ "Enter", "=" ],
            kbdClass : "wide",
            desc : "Perform current operator, 'add' if none is set."
          }
        ]
      }, // buttonDocs.modifiers
              
      "entry" : {
        caption : "Data Entry",
        buttons : [
          {
            kbd : "0",
            samp : "0",
            desc : "Zero"
          }, {
            kbd : "1",
            samp : "1",
            desc : "One"
          }, {
            kbd : "2",
            samp : "2",
            desc : "Two"
          }, {
            kbd : "3",
            samp : "3",
            desc : "Three"
          }, {
            kbd : "4",
            samp : "4",
            desc : "Four"
          }, {
            kbd : "5",
            samp : "5",
            desc : "Five"
          }, {
            kbd : "6",
            samp : "6",
            desc : "Six"
          }, {
            kbd : "7",
            samp : "7",
            desc : "Seven"
          }, {
            kbd : "8",
            samp : "8",
            desc : "Eight"
          }, {
            kbd : "9",
            samp : "9",
            desc : "Nine"
          }, {
            kbd : ".",
            samp : ".",
            desc : "Decimal Point"
          }
        ]
      } // buttonDocs.entry
      
    }, // buttonDocs
    
    flagDocs = {
    
      views : {
        title : "Views",
        desc : "What value the display is currently showing",
        flags : [
          [ "T", "Total" ],
          [ "E", "Entry" ]
        ]
      }, // flagDocs.views
      
      operators : {
        title : "Operators",
        desc : "Which operator the next operator will trigger.",
        flags : [
          [ "+", "Add" ],
          [ "-", "Subtact" ],
          [ "*", "Multiply" ],
          [ "\u00F7", "Divide" ]
        ]
      }, // flagDocs.operators
      
      errors : {
        title : "Errors",
        desc : "Note that if you divide by zero or an overflow occurs, the calculator will also trigger the error state.",
        flags : [
          [ "OVF", "Overflow, value was too large or small for the calculator's display or accuracy" ],
          [ "DV0", "Divide by zero" ],
          [ "ERR", "Error, calculator will not respond until you hit the clear button." ]
        ]
      }, // flagDocs.errors
      
      memory : {
        title : "Memory",
        flags : [
          [ "MEM", "There is a value stored in memory" ]
        ]
      } // flagDocs.flags
      
    }, // flagDocs
    
    template = {
    
      keyCell : (data, tagName) => {
        const
          td = document.createElement("td");
          values = data[tagName] instanceof Array ? data[tagName] : [data[tagName]],
          className = data[tagName + "Class"] || "";
        for (value of values) {
          if (value) td.__make(tagName, { className }, [ "span", value ]);
          else td.__make("em", "none");
          className = null;
        }
        return td;
      }, // template.keyCell
      
      keyCellTables : (docData) => {
        let result = [];
        for (const [className, data] of Object.entries(docData)) {
          const tbody = document.__make("tbody");
          for (const button of data.buttons) {
            tbody.__make(
              "tr", 
              template.keyCell(button, "kbd"),
              template.keyCell(button, "samp"),
              [ "th", { scope : "row" }, button.desc ]
            );
          }
          result.push(document.__make(
            "table",
            { className },
            ["caption", data.caption ],
            tbody
          ));
        }
        return result;
      }, // template.keyCellTables
      
      flag : (docData) => {	
        let result = [];
        for (const [className, data] of Object.entries(docData)) {
          const
            table = document.__make("table"),
            article = document.__make(
              "article",
              { className },
              [ "h3", data.title ]
            );
          for (const [flag, desc] of data.flags) table.__make(
            "tr",
            [ "th", { scope : "row" }, flag ],
            [ "td", desc ]
          );
          if (data.desc) article.__make("p", data.desc);
          article.appendChild(table);
          result.push(article);
        }
        return result;
      }, // template.flag
      
      indexLink : (ul, hash, className, ...contents ) => {
        const
          a = document.__make("a", { href : "#" + hash }, ...contents),
          li = ul.__make("li", a);
        if (className) li.className = className;
        return a;
      }, // template.indexLink
      
      index : (parent, id) => {
        const ul = document.createElement("ul");
        for (const [indexId, indexData] of Object.entries(docModals)) {
          if (id !== indexId) template.indexLink(ul, indexId, null, indexData.construct[0]);
        }
        parent.__make("nav", { className : "helpIndex" }, ul);
      }, // template.index
      
      pagination : (parent, id) => {
        const
          linkIds = docModals.__getPrevNext(id),
          ul = document.createElement("ul");
        if (linkIds.prev && (linkIds.prev !== docModalIndex)) template.indexLink(
          ul, linkIds.prev, "prev", docModals[linkIds.prev].construct[0]
        );
        if (id !== docModalIndex) template.indexLink(
          ul, docModalIndex, "index", docModals[docModalIndex].construct[0]
        );
        if (linkIds.next) template.indexLink(
          ul, linkIds.next, "next", docModals[linkIds.next].construct[0]
        );
        parent.__make(
          "footer",
          [ "nav", { className : "helpPagination" },  ul ]
        );
      } // template.pagination
      
    }, // template
    
    docModals = {
    
      help : {
        construct : [
          "Help Index"
        ],
        index : true
      }, // .modal#help
    
      about : {
        construct : [
          "About This Application",
          [
            "div",
            { className : "trailingPlate" },
            [ "div", { className : "icon_psn" }, "\K" ],
            "Calculator Demo", [ "br" ],
            "by Jason M. Knight", [ "br" ],
            "Paladin Systems North", [ "br" ],
            "January 2023"
          ], [
            "p",
            "This calculator was created as a demo of how HTML and CSS can be used to draw very complex shapes and layouts without the use of images. Indeed this entire program only uses one separate image file in the form of the canvas desktop. The only other thing that could be considered an image is the use of an SVG file embedded in the CSS to create a noise pattern; again, just another texture."
          ], [
            "p",
            "This demo also shows how to build elements directly on the DOM, and creating a JSON representation that is more efficient for turning into scripting controlled DOM than attempts to use anything resembling HTML such as JSX.",
            [ "i", "Though that is to be fair a very subjective matter of opinion. Personally I find JavaScript very bad at working with markup; at least compared to directly using the DOM with a couple helper functions." ]
          ], [
            "p",
            "For more information please read ",
            [ "a", { href : "https://medium.com/codex/how-css-is-reducing-the-need-for-images-lets-style-a-calculator-ccf9332e56e" }, "my articles on Medium detailing how this was built." ]
          ]
        ]
      }, // .modal#about
    
      inputAndControls : {
        construct : [
          "Input And Controls",
          [ "p", "These tables show the keyboard shortcuts and descriptions corresponding to the on-screen keypad. If more than one key is listed, both are valid." ],
          [
            "article",
            { className : "reference" },
            ...template.keyCellTables(buttonDocs)
          ]
        ]
      }, // .modal#inputAndControls
      
      indicatorPanel : {
        construct : [
          "Indicator Panel",
          [ "p", "The indicator is a series of lights below the primary display. It shows information about the calculators current state such as the type of information the display is showing, the currently active operator, errors, and if a value is stored in memory." ],
          [
            "div",
            { className : "flagArticles" },
            ...template.flag(flagDocs)
          ]
        ]
      } // .modal#displayAndFlags
      
    }; // docModals
    
  let	docModalIndex = null;
    
  for ( [id, data] of Object.entries(docModals)) {
    data.element = document.__makeModal("div", id, ...data.construct);
    if (data.index) {
      docModalIndex = id;
      template.index(data.element, id);
    } else template.pagination(data.element, id);
  }

}