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

    set value(h) {
        if ( h !== this.holes ) {
            this.item.value = h;
        }
        this.read() ;
    }

    get value() {
        return this.holes;
    }
}
var H = new Holes() ;

class GardenView {
    constructor() {
        this.svg = document.getElementById("svg_view");
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

    layout() {
        let lay = document.getElementById("svg_layout");
        lay.innerHTML = this.create_svg( G.foxes.map ( (_,i) => i+"" ), false );
        lay.addEventListener('click', () => O.resumegame() );
        
    }
}

class GardenView_Circular extends GardenView {
    add_history_row(s) {
        let Th = s.map( (_,i) => `<circle class="old_hole" cx="0" cy="-600" r="50" transform="rotate(${360.*i/s.length})" />`).join("");
        let Tf = s.map( (ss,i) => `<text class="old_fox" x="0" y="-580" transform="rotate(${360.*i/s.length})">${ss}</text><`).join("");
        this.history.push( `<circle cx="0" cy="0" r="600" stroke="grey" stroke-width="3" fill="none" />${Th}${Tf}`);
    }
        
    show_history() {
        if ( this.history.length == 0 ) {
            return "";
        } else {
            return this.history.reduce( (t,x) => `<g transform="scale(.86) rotate(5)">${t}</g>${x}` );
        }
    }

    create_svg(s, show_arrows=true) {
        let f = G.foxes ;
        let p = G.poison_list;
        let Th = s.map( (_,i) => `<circle class="svg_hole" cx="0" cy="-800" r="150" transform="rotate(${360.*i/s.length})"/>`).join("");
        let Tf = s.map( (ss,i) => `<text class="svg_fox" x="0" y="-740" transform="rotate(${360.*i/s.length})">${ss}</text>`).join("");
        let Tl = "";
        let Tr = "";
        let Thist = "";
        if ( show_arrows ) {
            Tl = f.map( (ff,i) => `<use href=${(ff&&p.indexOf(i)==-1)?"#svg_larrow":"#svg_nofox"} transform="rotate(${360.*i/f.length})" />`).join("");
            Tr = f.map( (ff,i) => `<use href=${(ff&&p.indexOf(i)==-1)?"#svg_rarrow":"#svg_nofox"} transform="rotate(${360.*i/f.length})" />`).join("");
            Thist = this.show_history() ;
        }
        let Tc = s.map( (_,i) => `<circle class="svg_click" cx="0" cy="-800" r="150" id=${"top_"+i} transform="rotate(${360.*i/s.length})" onmouseover="this.style.stroke='red'" onmouseout="this.style.stroke='black'"/>`).join("");
        return `<svg viewBox="-1000 -1000 2000 2000"> preserveAspectRatio="xMidYMid meet" width="100%"
            <circle cx="0" cy="0" r="803" stroke="grey" stroke-width="3" fill="none" />
            <circle cx="0" cy="0" r="797" stroke="grey" stroke-width="3" fill="none" />
            <def>
                <text id="svg_rarrow" x="100" y="-750" rotate="15">&#8594;</text>
                <text id="svg_larrow" x="-300" y="-700" rotate="-15">&#8592;</text>
            </def>
            ${Th}
            ${Tf}
            ${Tl}
            ${Tr}
            ${Tc}
            ${Thist}
            Sorry, your browser does not support inline SVG.  
        </svg>` ;
    }

}

class GardenView_Linear extends GardenView {
    add_history_row(s) {
        let Th = s.map( (_,i) => `<circle class="old_hole" cx="0" cy="200" r="50"  transform="translate(${i*350})" />`).join("");
        let Tf = s.map( (ss,i) => `<text class="old_fox" x="0" y="225" transform="translate(${i*350})">${ss}</text>`).join("");
        this.history.push( `<line x1="0"y1="200" x2="${350*(H.value-1)}" y2 = "200" stroke="grey" stroke-width="3"/>${Th}${Tf}` );
    }
        
    show_history() {
        if ( this.history.length == 0 ) {
            return "";
        } else {
            return this.history.reduce( (t,x) => `<g transform="translate(0,105)">${t}</g>${x}` );
        }
    }

    create_svg(s, show_arrows=true) {
        let f = G.foxes ;
        let Th = s.map( (_,i) => `<circle class="svg_hole" cx="0" cy="0" r="150" transform="translate(${i*350})"/>`).join("");
        let Tf = s.map( (ss,i) => `<text class="svg_fox" x="0" y="60" transform="translate(${i*350})">${ss}</text>`).join("");
        let Tl = "";
        let Tr = "";
        let Thist = "";
        if ( show_arrows ) {
            Tl = f.map( (ff,i) => i==0?"":`<use href=${ff?"#svg_larrow":"#svg_nofox"} transform="translate(${i*350})" />`).join("");
            Tr = f.map( (ff,i) => i==(s.length-1)?"":`<use href=${ff?"#svg_rarrow":"#svg_nofox"} transform="translate(${i*350})" />`).join("");
            Thist = this.show_history() ;
        }
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
            ${Thist}
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
        if ( h.length == O.visits ) {
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
        document.getElementById("raided").value=G.day*O.visits;
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
            moves.forEach( m => s[m] = "&#128064;" );
            poisons.forEach( p => s[p] = "&#9763;" );
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
    constructor () {
    }

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

    get poison_list() { // returns just the elements as an array
        return this.poison_array().map( (p,i) => p?i:-1 ).filter( i => i>-1 ) ;
    }

    poison_array() { // returns true/false array
        let p = Array(H.value).fill(false);
        if ( O.poison_days > 0 ) {
            this.inspections.slice(-O.poison_days).forEach( d => d.forEach( i => p[i]=true ) ) ;
        }
        return p ; 
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
                let esc = this.fox_moves(h) ; // all moves
                let e = esc.filter( ee=> !plist[ee] ) ; // exclude poisoned
                e.forEach( ee => current_fox[h] ||= old_locations[ee] );
                e.forEach( ee => current_stats[h] += old_stats[ee]/esc.length );
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
   constructor() {
        super() ;
        TV = new TableView() ;
        GV = new GardenView_Linear() ;
    }

    fox_moves (h) { // returns an array of landing spots
        return [ h-1, h+1 ].filter( hh => hh>=0 ).filter( hh => hh<H.value) ;
    }
}

class Game_Circular extends Game {
   constructor() {
        super() ;
        TV = new TableView() ;
        GV = new GardenView_Circular() ;
    }

    fox_moves (h) { // returns an array of landing spots
        return [ h-1, h+1 ].map( hh => (hh+H.value)%H.value );
    }
}

class Cookie { //convenience class
    static set( cname, value ) {
      // From https://www.tabnine.com/academy/javascript/how-to-set-cookies-javascript/
        let date = new Date();
        date.setTime(date.getTime() + (400 * 24 * 60 * 60 * 1000)); // > 1year
        document.cookie = `${cname}=${encodeURIComponent(JSON.stringify(value))}; expires=${date.toUTCString()}; SameSite=None; Secure; path=/`;
    }

    static get( cname ) {
        const name = `${cname}=`;
        let ret = null;
        decodeURIComponent(document.cookie).split('; ').filter( val => val.indexOf(name) === 0 ).forEach( val => {
            try {
                ret = JSON.parse( val.substring(name.length) );
                }
            catch(err) {
                ret =  val.substring(name.length);
                }
        });
        return ret;
    }

}

class Overlay {
	constructor () {
        // Parameters  -- standard game first
        this.classic() ;
        this.cookies() ;
	}

    classic() {
        // Parameters  -- standard game first
        this.geometry = "linear";
        this.visits = 1;
        this.poison_days = 0;
    }

    circle () {
        this.geometry = "circular";
        this.visits = 2;
        this.poison_days = 0;
    }

    poison() {
        this.geometry = "circular";
        this.visits = 1;
        this.poison_days = 1;
    }

    custom() {
        this.geometry = document.querySelector('input[name="arrange"]:checked').value;
        this.visits = document.getElementById("holesper").value ;
        this.poison_days = document.getElementById("poisoneddays").value
    }

    fillin() { // updates rule and choose to match current game settings

        // holes
        document.getElementById("rholes").value = H.value;
        Cookie.set("holes",H.value);

        // visits
        document.getElementById("rvisits").value = this.visits;
        document.getElementById("holesper").value = this.visits;
        Cookie.set("visits", this.visits );

        // geometry
        switch (this.geometry) {
            case "circular":
                document.getElementById("rarrange").innerHTML = `The ${H.value} foxholes are arranged in a circle.`;
                break;
            case "linear":
            default:
                document.getElementById("rarrange").innerHTML = `The ${H.value} fox holes are arranged in a line. The fox cannot move past either end of the line.`;
                break;
            }
        document.querySelectorAll('input[name="arrange"]').forEach( a => a.checked=(a.value==this.geometry) );
        Cookie.set("geometry", this.geometry );

        // poison
        if ( this.poison_days==0 ) {
            document.getElementById("rpoison").innerHTML = `Organic! No poisoning. The fox can move back in that very night after your daytime inspection.`;
        } else {
            document.getElementById("rpoison").innerHTML = `You are a poisoner! The hole is uninhabitable for ${this.poison_days} day(s) after your inspection.`;
        }
        document.getElementById("poisoneddays").value = this.poison_days;
        Cookie.set("poison_days", this.poison_days );
    }

    cookies() {
        let x = Cookie.get("holes") ;
        if ( x ) {
            console.log(x);
            H.value = x ;
        }
        x = Cookie.get("geometry") ;
        if ( x ) {
            console.log(x);
            this.geometry = x ;
        }
        x = Cookie.get("visits") ;
        if ( x ) {
            console.log(x);
            this.visits = x ;
        }
        x = Cookie.get("poison_days") ;
        if ( x ) {
            console.log(x);
            this.poison_days = x ;
        }
        this.fillin() ;
    }
    
    select(game_type) {
        switch( game_type) {
            case "classic":
                this.classic();
                break ;
            case "circle":
                this.circle();
                break;
            case "poison":
                this.poison();
                break;
            case "custom":
                this.custom();
                break;
            default:
        }
        // fill in fields
        this.newgame();
    }
        
    hide() {
        ["svg_view","Ttable","choose","rules","layout"].forEach( d => document.getElementById(d).style.display="none" );
    }

    layout() {
        this.hide() ;
        GV.layout();
        document.getElementById("layout").style.display="block";
    }

    choose() {
        this.hide() ;
        document.getElementById("choose").style.display="block";
    }

    rules() {
        this.hide() ;
        this.fillin();
        document.getElementById("rules").style.display="block";
    }

    resumegame() {
        this.garden(this.onstate)
    }

    newgame() {
        this.resumegame();
        switch( this.geometry ) {
            case "linear":
                G = new Game_Linear() ;
                break ;
            case "circular":
            default:
                G = new Game_Circular() ;
                break ;
            }
        G.start();
    }

	garden( onstate ) {
        this.hide();
        this.onstate = onstate ;
		if ( onstate ) {
			document.getElementById("svg_view").style.display="block";
			document.getElementById("Bgarden").style.backgroundColor = "white";
			document.getElementById("Btable").style.backgroundColor = "grey";
		} else {
			document.getElementById("Ttable").style.display="block";
			document.getElementById("Bgarden").style.backgroundColor = "grey";
			document.getElementById("Btable").style.backgroundColor = "white";
		}
	}

    changeInput() {
        if ( H.change ) {
            this.newgame() ;
        }
    }
}
var O = new Overlay();
O.garden(true);
O.newgame();

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
