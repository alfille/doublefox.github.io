"use strict";

/* jshint esversion: 6 */

var H ; // Hole class
var G ; // Game class -- controls rules and selects display
var TV = null ; // TableView
var GV = null ; // GardenView
var O ; // Overlay control

class Holes {
    constructor() {
        this.item = document.getElementById("holes");
        this.read();
    }

    read() {
        // get Number of holes from input field
        let n = parseInt(this.item.value);
        let update = true ;
        if (n<1) {
            // bad input
            n = 5 ;
        } else if (n<2) {
            n = 2;
        } else if ( n>12 ) {
            n = 12;
        } else {
            update = false;
        }
        if (update) {
            this.item.value=n;
        }
        this.holes = n;
    }

    get change() {
        let h = this.holes ;
        this.read();
        return ( h != this.holes ) ;
    }

    get value() {
        return this.holes;
    }
}
var H = new Holes() ;

class GardenView {
    constructor() {
        this.svg = document.getElementById("svg");
        this.head = document.getElementById("top");
        window.onresize = this.dimension_control();
    }

    start() {
        this.history = [] ;
    }

    back() {
        this.history.pop();
    }

    dimension_control() {
        let x = Math.min(this.svg.clientWidth,window.innerHeight-this.head.offsetHeight);
        this.svg.style.width = x+"px";
        this.svg.style.height = x+"px";
    }


    control_row(symbol_list) {
        this.svg.innerHTML = this.create_svg(symbol_list) ;
        if ( G.number !== 0 ) {
            this.svg.onload = G.foxes.forEach( (_,i)=>document.getElementById("top_"+i).addEventListener('click', (e) => this.click(e.target)) );
        }
        this.svg.onload = this.dimension_control() ;
    }

    click(target) {
        let hole = parseInt(target.id.split('_')[1]) ;
        TV.click(hole);
        target.style.strokeWidth = TV.checked(hole) ? "30" : "10" ;
    }
}

class GardenViewCircle extends GardenView {
    add_history_row(s) {
        let Th = s.map( (_,i) => `<circle class="old_hole" cx="0" cy="600" r="50" transform="rotate(${360.*i/s.length})" />`).join("");
        let Tf = s.map( (ss,i) => `<g transform="rotate(${360.*i/s.length})"><text class="old_fox" x="42" y="580" rotate="180">${ss}</text></g>`).join("");
        this.history.push( `<circle cx="0" cy="0" r="600" stroke="grey" stroke-width="3" fill="none" />${Th}${Tf}`);
    }
        
    show_history() {
        if ( this.history.length == 0 ) {
            return "";
        } else {
            return this.history.reduce( (t,x) => `<g transform="scale(.86) rotate(5)">${t}</g>${x}` );
        }
    }

    create_svg(s) {
        let f = G.foxes ;
        let Th = s.map( (_,i) => `<circle class="svg_hole" cx="0" cy="800" r="150" transform="rotate(${360.*i/s.length})"/>`).join("");
        let Tf = s.map( (ss,i) => `<g transform="rotate(${360.*i/s.length})"><text class="svg_fox" x="125" y="740" rotate="180">${ss}</text></g>`).join("");
        let Tl = f.map( (ff,i) => `<use href=${ff?"#svg_larrow":"#svg_nofox"} transform="rotate(${360.*i/f.length})" />`).join("");
        let Tr = f.map( (ff,i) => `<use href=${ff?"#svg_rarrow":"#svg_nofox"} transform="rotate(${360.*i/f.length})" />`).join("");
        let Tc = s.map( (_,i) => `<circle class="svg_click" cx="0" cy="800" r="150" id=${"top_"+i} transform="rotate(${360.*i/s.length})" onmouseover="this.style.stroke='red'" onmouseout="this.style.stroke='black'"/>`).join("");
        return `<svg viewBox="-1000 -1000 2000 2000"> preserveAspectRatio="xMidYMid meet" width="100%"
            <circle cx="0" cy="0" r="803" stroke="grey" stroke-width="3" fill="none" />
            <circle cx="0" cy="0" r="797" stroke="grey" stroke-width="3" fill="none" />
            <def>
                <text id="svg_rarrow" x="100" y="790" rotate="-15">&#8594;</text>
                <text id="svg_larrow" x="-300" y="740" rotate="15">&#8592;</text>
            </def>
            ${Th}
            ${Tf}
            ${Tl}
            ${Tr}
            ${Tc}
            ${this.show_history()}
            Sorry, your browser does not support inline SVG.  
        </svg>` ;
    }

}

class GardenViewLine extends GardenView {
    add_history_row(s) {
        let Th = s.map( (_,i) => `<circle class="old_hole" cx="0" cy="200" r="50"  transform="translate(${i*350})" />`).join("");
        let Tf = s.map( (ss,i) => `<text class="old_fox" x="-41" y="225" transform="translate(${i*350})">${ss}</text>`).join("");
        this.history.push( `<line x1="0"y1="200" x2="${350*(H.value-1)}" y2 = "200" stroke="grey" stroke-width="3"/>${Th}${Tf}` );
    }
        
    show_history() {
        if ( this.history.length == 0 ) {
            return "";
        } else {
            return this.history.reduce( (t,x) => `<g transform="translate(0,105)">${t}</g>${x}` );
        }
    }

    create_svg(s) {
        let f = G.foxes ;
        let Th = s.map( (_,i) => `<circle class="svg_hole" cx="0" cy="0" r="150" transform="translate(${i*350})"/>`).join("");
        let Tf = s.map( (ss,i) => `<text class="svg_fox" x="-120" y="60" transform="translate(${i*350})">${ss}</text>`).join("");
        let Tl = f.map( (ff,i) => i==0?"":`<use href=${ff?"#svg_larrow":"#svg_nofox"} transform="translate(${i*350})" />`).join("");
        let Tr = f.map( (ff,i) => i==(s.length-1)?"":`<use href=${ff?"#svg_rarrow":"#svg_nofox"} transform="translate(${i*350})" />`).join("");
        let Tc = s.map( (_,i) => `<circle class="svg_click" cx="0" cy="0" r="150" transform="translate(${i*350})" id=${"top_"+i}  onmouseover="this.style.stroke='red'" onmouseout="this.style.stroke='black'"/>`).join("");
        return `<svg viewBox="-200 -250 ${350*(H.value-1)+400} 1300"> preserveAspectRatio="xMidYMid meet" width="100%"
            <line x1="0" y1="0" x2="${350*(H.value-1)}" y2 = "0" stroke="grey" stroke-width="9"  />
            <def>
                <text id="svg_rarrow" x="0" y="160">&#8594;</text>
                <text id="svg_larrow" x="-200" y="160">&#8592;</text>
            </def>
            ${Th}
            ${Tf}
            ${Tl}
            ${Tr}
            ${Tc}
            ${this.show_history()}
            Sorry, your browser does not support inline SVG.  
        </svg>` ;
    }

}

class TableView {
    constructor() {
        this.table = document.querySelector("table") ;
        this.thead = this.table.querySelector("thead") ;
        this.tbody = this.table.querySelector("tbody") ;
        this.stats = false;
    }

    stats_row() {
        let r = document.createElement("tr");
        let h = document.createElement("th");
        h.innerText = "Probability" ;
        r.appendChild(h) ;
        for ( let i = 1 ; i <= H.value ; ++i ) {
            h = document.createElement("th");
            r.appendChild(h) ;
        }
        this.thead.insertBefore(r,this.thead.firstElementChild);
    }

    statchange() {
        let s = this.stats ;
        this.stats = document.getElementById("stats").checked ;
        if (s == this.stats ) {
        } else if ( this.stats ) {
            this.stats_row() ;
            this.update() ;
        } else {
            this.thead.removeChild(this.thead.firstElementChild);
        }
    }

    start() {
        this.header();
        GV.start();
        this.tbody.innerHTML = "";
        this.control_row();
        this.update();
    }
    
    click(hole) {
        [...this.tbody.lastElementChild
            .querySelectorAll("input")]
            .filter( i=>parseInt(i.getAttribute("data-n"))==hole )[0].click();
    }

    check(hole) {
        let h = [...this.tbody.lastElementChild.querySelectorAll("input")]
            .filter( c=>c.checked )
            .map(c=>parseInt(c.getAttribute("data-n")));
        if ( h.length == G.holes_per_day ) {
            this.move(h) ;
        }
    }

    checked(hole) {
        let inp = [...this.tbody.lastElementChild.querySelectorAll("input")] ;
        if ( inp.length == 0 ) {
            return false ;
        }
        return inp.filter( c=>parseInt(c.getAttribute("data-n"))==hole )[0].checked ;
    }

    control_row() {
        let r = document.createElement("tr");
        let s = this.symbols( [], G.poison_list, G.foxes );
        for ( let i = 0; i <= H.value ; ++i ) {
            let d = document.createElement("td");
            if ( i==0 ) {
                d.innerHTML = `Day ${G.day}`;
            } else if ( G.number == 0 ) {
                d.innerHTML = s[i-1];
            } else {
                d.innerHTML = s[i-1] + "<br>" ;
                let b = document.createElement("input");
                b.type = "checkbox";
                b.onclick = () => TV.check(i-1) ;
                b.setAttribute("data-n",i-1);
                d.appendChild(b);
            }
            r.appendChild(d);
        }
        let d = document.createElement("td");
        this.tbody.appendChild(r);
        GV.control_row(s);
    }

    back() {
        if ( G.day < 2 ) {
            this.start() ;
        } else {
            this.remove_row();
            this.remove_row();
            G.back();
            GV.back();
            this.control_row();
        }
        this.update();
    }

    update() {
        document.getElementById("raided").value=G.day*2;
        if ( this.stats ) {
            let p = this.thead.firstElementChild.childNodes;
            G.stats.forEach( (v,i) => p[i+1].innerText = v.toFixed(3) );
        }
    }
        

    move(holes) { // hole 0-based
        G.move(holes);
        this.remove_row();
        this.add_history_row();
        this.control_row();
        this.update();
    }

    symbols( moves, poisons, foxes ) {
        // moves = list of inspection holes
        // poisons = list of poisoned holes
        // foxes = true/false fox occupation list
        // returns a symbol list
        if ( G.number == 0 && moves.length==0 ) {
            // victory
            return foxes.map( (_,i) => i&1 ? "&#128077;" : "&#128516;" ) ;
        } else {
            let s = foxes.map( f => f?"&#129418;":"&nbsp;" ) ;
            moves.forEach( m => s[m] = "&#x274c;" );
            poisons.forEach( p => s[p] = "&#9760;" );
            return s ;
        }
    } 

    add_history_row() { // historical row
        let [m,p,f] = G.prior ;
        let r = document.createElement("tr");
        let s = this.symbols( m, p, f );
        for ( let i = 0; i <= H.value ; ++i ) {
            let d = document.createElement("td");
            if ( i==0 ) {
                d.innerHTML = `Day ${G.day-1}`;
            } else {
                d.innerHTML = s[i-1] ;
            }
            r.appendChild(d);
        }
        let d = document.createElement("td");
        this.tbody.appendChild(r);
        GV.add_history_row(s);
    }

    remove_row() {
        this.tbody.removeChild( this.tbody.lastChild ) ;
    }

    header() {
        this.thead.innerHTML = "";
        let r = document.createElement("tr");
        let h = document.createElement("th");
        h.innerText = "Day" ;
        r.appendChild(h) ;
        for ( let i = 1 ; i <= H.value ; ++i ) {
            h = document.createElement("th");
            h.innerText = i + "" ;
            r.appendChild(h) ;
        }
        this.thead.appendChild(r) ;
    }
    
}
class Game {
    start () {
        this.inspections = [];
        this.date = 0;
        let current_fox = Array(H.value).fill(true);
        let current_stats = Array(H.value).fill( 1. / H.value );
        this.fox_history = [current_fox] ;
        this.stats_history = [current_stats];
        this.inspections = [] ;
        TV.start() ;
    }

    poison_array() { // returns true/false array
        let p = Array(H.value).fill(false);
        this.inspections.slice(-this.poison_days).forEach( d => d.forEach( i => p[i]=true ) ) ;
        return p ; 
    }

    get poison_list() { // returns just the elements as an array
        return this.poison_array().map( (p,i) => p?i:-1 ).filter( i => i>-1 ) ;
    }

    move( inspect ) { // holes is an array
        // inspections are 0-based
        this.inspections[this.date] = inspect ;
        this.date += 1;

        // use previous fox locations
        let old_locations = this.fox_history[this.date-1].slice() ;
        let old_stats = this.stats_history[this.date-1].slice() ;

        // exclude inspected hole
        inspect.forEach( h => {
            old_locations[h] = false ;
            old_stats[h] = 0. ;
            });

        let current_fox = Array(H.value).fill(false) ;
        let current_stats = Array(H.value).fill(0) ;

        let plist = this.poison_array() ;
        
         plist.forEach( (p,h) => {
             if ( !p ) {
                let e = this.fox_moves(h).filter( ee=> !plist[ee] ) ; // where fox can go
                e.forEach( ee => current_fox[h] ||= old_locations[ee] );
                e.forEach( ee => current_stats[h] += old_stats[ee]/e.length );
            }
            });

        // store
        this.fox_history[this.date] = current_fox;
        this.stats_history[this.date] = current_stats;
    }

    get foxes() {
        return this.fox_history[this.date] ;
    }

    get stats() {
        return this.stats_history[this.date] ;
    }

    get prior() {
        return [this.inspections[this.date-1]||[],[],this.fox_history[this.date-1]];
    }

    back() { // backup a move
        this.date -= 1 ;
    }

    get number() { // of foxes left
        return this.fox_history[this.date].filter(f=>f).length ;
    }

    get day() {
        return this.date;
    }

    get poison_days() {
        return 1 ;
    }
}

class Game_Linear extends Game {
    fox_moves (h) { // returns an array of landing spots
        return [ h-1, h+1 ].filter( hh => hh>=0 ).filter( hh => hh<H.value) ;
    }
}

class Game_Circular extends Game {
    fox_moves (h) { // returns an array of landing spots
        return [ h-1, h+1 ].map( hh => (hh+H.value)%H.value );
    }
}

class Game_Fox extends Game_Linear {
    constructor() {
        super() ;
        TV = new TableView() ;
        GV = new GardenViewLine() ;
    }
    
    get holes_per_day() {
        return 1 ;
    }
}
var G = new Game_Fox();
G.start() ;


function changeInput() {
    if ( H.change ) {
        G.start() ;
    }
}

class Overlay {
	constructor () {
		this.Garden( true ) ;
	}
	
	Garden( onstate ) {
		if ( onstate ) {
			document.getElementById("svg").style.display="block";
			document.getElementById("Ttable").style.display="none";
			document.getElementById("Bgarden").style.backgroundColor = "white";
			document.getElementById("Btable").style.backgroundColor = "grey";
		} else {
			document.getElementById("svg").style.display="none";
			document.getElementById("Ttable").style.display="block";
			document.getElementById("Bgarden").style.backgroundColor = "grey";
			document.getElementById("Btable").style.backgroundColor = "white";
		}
	}
}
var O = new Overlay();

// Application starting point
window.onload = () => {
    // Initial splash screen

    // Stuff into history to block browser BACK button
    window.history.pushState({}, '');
    window.addEventListener('popstate', ()=>window.history.pushState({}, '') );

    // Service worker (to manage cache for off-line function)
    if ( 'serviceWorker' in navigator ) {
        navigator.serviceWorker
        .register('/sw.js')
        .catch( err => console.log(err) );
    }
    
};
