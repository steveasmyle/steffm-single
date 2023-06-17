/*
	calc.app.js
	Jason M. Knight
	January 2023

	REQUIRES
		dom.lib.php
	POLLUTES
		nothing
	EVENTS
		window keyup, keydown, keypress
*/

{

	const
		calcTitle = "Computron",
		calcVersion = "V90",

		flags = {};
		
	let
		clearNextEntry = false;

	{ // START isolating scope block for "flags"

		const

			flagData = {
				total : {
					title : "Viewing Total",
					text : "T"
				},
				entry : {
					title : "Viewing Entry",
					text : "E"
				},
				add : {
					className : "smallGlyph",
					title : "Addition operator active",
					text : "+"
				},
				subtract : {
					className : "smallGlyph",
					title : "Subtraction operator active",
					text : "-"
				},
				multiply : {
					title : "Multiplication operator active",
					text : "X"
				},
				divide : {
					className : "smallGlyph",
					title : "Divide operator active",
					text : "\u00F7"
				},
				overflow : {
					title : "Overflow, result was too large for this calculator",
					text : "OVF"
				},
				divideByZero : {
					title : "Divide by zero",
					text : "DV0"
				},
				error : {
					title : "An error has occurred, you must hit 'clear' to continue.",
					text : "ERR"
				},
				memory : {
					title : "This is a value in memory",
					text : "MEM"
				}
			}, // flagData

			flagSet = (name, value) => {
				// force to boolean
				value = !!value;
				const flag = flagData[name];
				flag.value = value;
				flag.element.textContent = value ? flag.text : "";
				return value;
			},  // flagSet

			operatorSet = (name) => {
				for (let operator of [ "add", "subtract", "multiply", "divide" ]) {
					const
						flag = flagData[operator],
						value = name == operator;
					flag.value = value;
					flag.element.textContent = value ? flag.text : "";
				}
			}, // operatorSet

			flagClear = (name) => {
				flagData[name].value = false;
				flagData[name].element.textContent = "";
			}; // flagSet

		Object.defineProperties(flags, {

			clear : {
				value : function() {
					for (let name in this) flagClear(name);
					if (localStorage.getItem("calculatorMemory")) flags.memory = true;
				}
			}, // flags.clear
			
			element : {
				value : document.__make("ul", { className : "flags" })
			}, // flags.element

			total : {
				enumerable : true,
				get : () => flagData.total.value,
				set : (value) => flagSet("entry", !flagSet("total", value))
			}, // flags.total

			entry : {
				enumerable : true,
				get : () => flagData.entry.value,
				set : (value) => flagSet("total", !flagSet("entry", value))
			}, // flags.entry

			add  : {
				enumerable : true,
				get : () => flagData.add.value,
				set : (value) => operatorSet("add", value)
			}, // flags.add

			subtract  : {
				enumerable : true,
				get : () => flagData.subtract.value,
				set : (value) => operatorSet("subtract", value)
			}, // flags.subtract

			multiply  : {
				enumerable : true,
				get : () => flagData.multiply.value,
				set : (value) => operatorSet("multiply", value)
			}, // flags.multiply

			divide  : {
				enumerable : true,
				get : () => flagData.divide.value,
				set : (value) => operatorSet("divide", value)
			}, // flags.divide

			overflow : {
				enumerable : true,
				get : () => flagData.overflow.value,
				set : function(value) {
					if (flagSet("overflow", value)) {
						calculator.total = 0;
						calculator.entry = "";
						this.error = true;
					}
				}
			}, // flags.overflow

			divideByZero : {
				enumerable : true,
				get : () => flagData.divideByZero.value,
				set : function(value) {
					if (flagSet("divideByZero", value)) this.error = true;
				}
			}, // flags.divideByZero

			error : {
				enumerable : true,
				get : () => flagData.error.value,
				set : (value) => {
					if (flagSet("error", value)) outputs.set("-", "------------");
				}
			}, // flags.error

			memory : {
				enumerable : true,
				get : () => flagData.memory.value,
				set : (value) => flagSet("memory", value)
			} // flags.memory

		} ); // flag properties
		
		for (let [name, data] of Object.entries(flagData)) {
			let e = flagData[name].element = flags.element.__make(
				"li", { title : data.title }
			);
			e.dataset.text = data.text;
			if (data.className) e.className = data.className;
		}

	} // END isolating scope block for "flags"
		
	const

		handlers = {
			
			action : {

				clear : () => {
					flags.clear();
					calculator.entry = calculator.operator = "";
					calculator.total = 0;
				}, // handlers.action.clear

				clearEntry : () => calculator.entry = "",

				negate : () => {
					let i = flags.entry ? "entry" : "total";
					calculator[i] = - calculator[i];
				}, // handlers.action.negate

				percent : () => calculator[ flags.entry ? "entry" : "total" ] /= 100,

				sqrt : () => {
					let i = flags.entry ? "entry" : "total";
					calculator[i] = Math.sqrt(calculator[i]);
				} // handlers.action.sqrt

			}, // handlers.action
			
			operator : {

				add : () => calculator.total = +calculator.total + +calculator.entry,

				subtract : () => calculator.total -= calculator.entry,

				multiply : () => calculator.total *= calculator.entry,

				divide : () => {
					if (!Number(calculator.entry)) {
						flags.divideByZero = true;
						calculator.total = Infinity;
					}
					else calculator.total /= calculator.entry
				}

			} // handlers.operator
			
		}, // handlers

		testEntryClear = () => {
			if (clearNextEntry) {
				calculator.entry = "";
				clearNextEntry = false;
			}
		}, // testEntryClear
		
		events = {

			action : (e) => {
				testEntryClear();
				handlers.action[e.currentTarget.value]();
			}, // events.action

			entry : (e) => {
				testEntryClear();
				let
					strEntry = String(calculator.entry);
					hasPoint = strEntry.indexOf(".") !== -1,
					maxLength = hasPoint ? 13 : 12,
					entryPoint = e.currentTarget.textContent === "."
				if (
					(strEntry.length >= maxLength) ||
					(hasPoint && entryPoint)
				) return;
				calculator.entry = (
					!calculator.entry && entryPoint ?
					"0." :
					strEntry + e.currentTarget.textContent
				);
			}, // events.entry

			memory : {

				add : (e) => {
					if (flags.error) return;
					calculator.memory += +output.textContent;
				}, // events.memory.add

				clear : (e) => {
					if (flags.error) return;
					calculator.memory = null;
				}, // events.memory.clear

				subtract : (e) => {
					if (flags.error) return;
					calculator.memory -= +output.textContent;
				}, // events.memory.subtract

				read : (e) => {
					if (flags.error) return;
					clearNextEntry = true;
					calculator.entry = calculator.memory;
				} // events.memory.read

			}, // events.memory

			openModal : (e) => location.hash = e.currentTarget.value,

			operator : (e) => {
				if (flags.error) return;
				if (calculator.operator) {
					if (
						!clearNextEntry ||
						(calculator.operator == e.currentTarget.value)
					) handlers.operator[calculator.operator]();
				} else calculator.total = calculator.entry;
				clearNextEntry = true;
				calculator.operator = e.currentTarget.value;
			}, // events.operator

			view : {
				total : (e) => calculator.total = calculator.total,
				entry : (e) => calculator.entry = calculator.entry
			} // events.view

		}, // events

		power = document.__make("div", { className : "power" }, "POWER"),

		outputs = {
			sign : document.createElement("var"),
			whole : new Text(),
			point : document.createElement("span"),
			mantissa : new Text(),
		},

		output = document.__make("output", ...Object.values(outputs) );

		fauxBody = document.getElementById("fauxBody"),

		calculator = {
			element : fauxBody.__make(
				"section", { className : "calc" },
				power,
				[ "h2", calcTitle, [ "span", calcVersion ] ],
				output,
				flags.element
			)
		};
		
		Object.defineProperty(events, "get", {
			value : function(name, action) {
				let result = this[name];
				if ("object" === typeof result) return result[action];
				return result;
			}
		} );
		
		Object.defineProperty(outputs, "set", {
			value : function(sign, whole, point = "", mantissa = "") {
				this.sign.textContent = sign;
				this.whole.textContent = whole;
				this.point.textContent = point;
				this.mantissa.textContent = mantissa;
			}
		} );
		

	{ // START isolating scope block for "calculator"

		const

			show = (value, isTotal) => {
				if (flags.error) return;
				if (!value) outputs.set("", "0");
				else if (!isFinite(value)) flags.overflow = true;
				else {
					value = (
						isTotal ?
						Number(value).toFixed(11).replace(/0+$/g, '') :
						String(value)
					);
					const sign = value < 0 ? "-" : "";
					if (sign) value = value.substr(1);
					const split = value.indexOf(".");
					if (split >= 0) {
						if (value < 1) {
							outputs.set(sign, "0", ".", value.substr(split + 1, 11) );
						} else {
							const
								whole = value.substr(0, split),
								mantissa = value.substr(split + 1);
							if (whole.length > 12) return flags.overflow = true;
							if ((mantissa.length > 0) || !isTotal) outputs.set(
								sign, whole, ".", mantissa.substr(0, 12 - whole.length)
							); else outputs.set(sign, whole);
						}
					} else if (value.length > 12) flags.overflow = true;
					else outputs.set(sign, value);
				}
			}; // local calc show

		let
			operator = "",
			total = 0,
			entry = "";

		Object.defineProperties(calculator, {

			entry : {
				get : () => entry,
				set : (value) => {
					entry = value;
					flags.entry = true;
					show(value);
					calculator.element.classList[
						entry == "55378008" ? "add" : "remove"
					]("flip");
				}
			}, // calculator.entry

			total : {
				get : () => total,
				set : (value) => {
					total = value;
					flags.total = true;
					show(value, true);
				}
			}, // calculator.total

			operator : {
				get : () => operator,
				set : (value) => {
					operator = value;
					if (operator) flags[operator] = true;
				}
			}, // calculator.operator

			memory : {
				get : () => Number(localStorage.getItem("calculatorMemory")) || 0,
				set : (value) => {
					if (value === null) {
						flags.memory = false;
						localStorage.removeItem("calculatorMemory");
					} else {
						localStorage.setItem("calculatorMemory", value);
						flags.memory = true;
					}
				}
			} // calculator.memory

		}); // calculator properties

	} // END isolating scope block for "calculator"


	{ // START isolating scope block for keys and buttons

		const

			buttonSets = [
				 // text, key, type, action, className
				[
					[ "VT", "T",        "view",   "total" ],
					[ "VE", "E",        "view",   "entry" ],
					[ "MC", "Delete",   "memory", "clear", "index" ],
					[ "M+", "PageUp",   "memory", "add"   ],
					[ "M-", "PageDown", "memory", "subtract" ],
					[ "MR", "Insert",   "memory", "read"  ]
				], [
					[ "C",  "Escape",    "action",    "clear",      "clear wide"        ],
					[ "CE", "Backspace", "action",    "clearEntry", "clear doubleDigit" ],
					[ "?",  "F1",        "openModal", "help" ]
				], [
					[ "\u221A", "S", "action",   "sqrt"    ],
					[ "\u00B1", "N", "action",   "negate"  ],
					[ "%",      "P", "action",   "percent" ],
					[ "\u00F7", "/", "operator", "divide"  ]
				], [
					[ "7", "7", "entry" ],
					[ "8", "8", "entry" ],
					[ "9", "9", "entry" ],
					[ "X", "*", "operator", "multiply" ]
				], [
					[ "4", "4", "entry" ],
					[ "5", "5", "entry", null, "index" ],
					[ "6", "6", "entry" ],
					[ "-", "-", "operator", "subtract" ]
				], [
					[ "1", "1", "entry" ],
					[ "2", "2", "entry" ],
					[ "3", "3", "entry" ],
					[ "+\r\n=", "+", "operator", "add", "tall" ],
					[ "0", "0", "entry", null, "wide" ],
					[ ".", ".", "entry" ]
				]
			], // buttonSets

			keys = {},

			keyAliases = {
				"=" : "Enter",
				"X" : "*"
			}, // keyAliases
			
			keyStateChange = (e) => {
				let key = getKeyButton(e.key);
				if (key) key.classList[
					e.type === "keydown" ? "add" : "remove"
				]("keyDown");
			}, // keyStateChange

			getKeyButton = (key) => {
				if (key.length == 1) key = key.toUpperCase();
				return keys[keyAliases[key] || key];
			}; // getKeyButton

		for (const set of buttonSets) {
			const fieldset = calculator.element.__make("fieldset");
			for (let [textContent, key, buttonType, action, className] of set) {
				keys[key] = fieldset.__make(
					"button",
					{
						className : buttonType + (className ? " " + className : ""),
						onclick : events.get(buttonType, action)
					},
					[ "span", textContent ]
				);
				if (action) keys[key].value = action;
			}
		}

		addEventListener("keydown", keyStateChange);
		addEventListener("keyup", keyStateChange);
		addEventListener("keypress", (e) => {
			if (location.hash.length > 1) return;
			let key = e.key;
			switch (key) {
				case "Enter":
					e.preventDefault();
					if (flags.error) return;
					flags.clear();
					if (!calculator.operator) operator = "add";
					handlers.operator[calculator.operator]();
					clearNextEntry = true;
					return;
			}
			let button = getKeyButton(key);
			if (button) {
				e.preventDefault();
				button.click();
			}
		} );

	} // END isolating scope block for keys and buttons

	calculator.entry = "";
	if (localStorage.getItem("calculatorMemory")) flags.memory = true;

}