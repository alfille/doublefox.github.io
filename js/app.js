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
        this.mult = 1; // for more complex shapes
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

    set xlength( m ) {
        this.holes = m;
        this.item.value = m;
    }

    get xlength() { // characteristic length
        return this.holes;
    }

    set ylength( m ) {
        this.mult = m ;
    }

    get ylength() {
        return this.mult;
    }

    get total() { // get total holes
        return this.holes * this.mult ;
    }
}
H = new Holes() ;

class GardenView {
    constructor() {
        this.svg = document.getElementById("svg_view");
        this.head = document.getElementById("top");
        this.hbutton = document.getElementById("HistoryButton");
        this.hslide = document.getElementById("Hslide");
        this.hval = document.getElementById("Hval");
        window.onresize = () => this.dimension_control();
    }

    start() {
        this.arrowlist = G.foxes.map( (_,i) => G.fox_moves(i) ) ;
        this.allarrows = this.arrowlist.map( (m,i) => m.map( mm => `<line id=${"arr"+i+"_"+mm} x1="0" y1="0" x2="0" y2="0" class="svg_arrow" marker-end="url(#arrowhead)" visibility="hidden" />`).join("")
            ).join("");
        this.X = [] ; // coordinates of holes
        this.Y = [] ;
        this.symbol_list = [];
        this.configure();
    }

    dimension_control() {
        let x = Math.min(this.svg.clientWidth,window.innerHeight-this.head.offsetHeight);
        //this.svg.style.width = x+"px";
        //this.svg.style.height = x+"px";
        if ( this.X.length == 0 ) {
            // get circle locations (get transform and calculate)
            G.foxes.forEach( (_,i) => {
                let up = document.getElementById("upper_"+i) ;
                let Cx = up.attributes.cx.value ;
                let Cy = up.attributes.cy.value ;
                let mtx = up.transform.baseVal.consolidate().matrix ;
                this.X[i] = Cx * mtx.a + Cy * mtx.c + mtx.e ;
                this.Y[i] = Cx * mtx.b + Cy * mtx.d + mtx.f ;
                });
        }
    }

    arrow_location() {
        this.arrowlist.forEach( (m,i) => m.forEach( mm => {
            let ll = document.getElementById("arr"+i+"_"+mm) ;
            ll.setAttribute( "x1", this.X[i]+"" ) ;
            ll.setAttribute( "y1", this.Y[i]+"" ) ;
            ll.setAttribute( "x2", this.X[i]*.7 + this.X[mm]*.3 +"" ) ;
            ll.setAttribute( "y2", this.Y[i]*.7 + this.Y[mm]*.3 +"" ) ;
            }) );
    }

    symbolize(s) {
        s.forEach( (ss,i) => document.getElementById("symbol_"+i).innerHTML = ss );
    }

    arrow_visibility(flist) {
        flist.forEach( (f,i) => this.arrowlist[i].forEach( m => document.getElementById("arr"+i+"_"+m).style.visibility= f?"visible":"hidden" ));
    }

    control_row(symbol_list) {
        this.symbol_list = symbol_list ;
        this.svg.innerHTML = this.create_svg("game");
            
        if ( G.number !== 0 ) {
            G.foxes.forEach( (_,i)=>document.getElementById("upper_"+i).addEventListener('click', (e) => this.click(e.target)) );
        }
        this.dimension_control() ;
        this.symbolize(symbol_list) ;
        this.arrow_visibility(G.foxes) ;
        this.arrow_location();
        if ( G.day == 0 ) {
            this.hbutton.innerText = "History ...";
        } else {
            this.hbutton.innerText = `History (${G.day})`;
        }
    }

    create_svg(display_state="game") {
        return `<svg id="svg_code" viewBox="${this.vb.x} ${this.vb.y} ${this.vb.width} ${this.vb.height}"> preserveAspectRatio="xMidYMid meet" width="100%"
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto" markerUnits="strokeWidth" >
                    <polygon points="0 0, 10 3.5, 0 7" />
                </marker>
            </defs>
            ${this.background}
            ${this.lower}
            ${this.allarrows}
            ${this.symbol}
            ${display_state=="game"?this.upper:""}
            Sorry, your browser does not support inline SVG.  
        </svg>` ;
    }

    click(target) {
        let hole = parseInt(target.id.split('_')[1]) ;
        TV.click(hole);
        target.style.strokeWidth = TV.checked(hole) ? "30" : "10" ;
    }

    layout() { // show layout of foxholes
        this.svg.innerHTML = this.create_svg("layout") ;
        this.symbolize(G.foxes.map( (_,i) => i+"" ) ); // numbers not foxes
        this.arrow_location(); // yes arrows
        this.arrow_visibility(G.foxes.map(_=>true));
    }

    history() { // set up to show history of foxholes
        this.hslide.min = 0;
        this.hslide.max = G.day;
        this.hend();
    }

    hstart() {
        this.hslide.value = 0;
        this.show_history();
    }
    hminus() {
        this.hslide.value = this.hslide.value-1;
        this.show_history();
    }
    hplus() {
        this.hslide.value = this.hslide.value+1;
        this.show_history();
    }
    hend() {
        this.hslide.value = G.day;
        this.show_history();
    }

    show_history() { // show history of foxholes
        this.svg.innerHTML = this.create_svg("history") ;
        let date = this.hslide.value;
        this.hval.value=date;
        let obMove = G.history(date);
        this.symbolize(TV.symbols(obMove)); // numbers not foxes
        this.arrow_location(); // yes arrows
        this.arrow_visibility(obMove.foxes);
    }

    post_layout() {
        this.control_row(this.symbol_list) // restore fox symbols
        O.resume(); // back to table
    }
}

class GardenView_Circle extends GardenView {
    configure() {
        let f = G.foxes ; // to get a "foxes" long array, we don't actually use the data now

        // Radii
        this.R = [(150*2+100)*H.xlength/(2*Math.PI)];
        for ( let y = 1 ; y < H.ylength ; ++y ) {
            this.R[y]=this.R[y-1]+350;
        } 
        this.total_radius = this.R[H.ylength-1]+200 ; // For inner circle radius plus layers, plus boundary

        this.vb = { // svg viewBox dimensions
            x: -this.total_radius,
            y: -this.total_radius,
            width: 2*this.total_radius,
            height: 2*this.total_radius,
        };
        this.background = `<circle cx="0" cy="0" r="${this.total_radius-200}" class="svg_boundary" />`;

        // Foxholes lower (has background) symbol (holds inhabitant) upper (for click and border)
        this.lower      = f.map( (_,i) => { let [l,h]=G.split(i,H.xlength); return `<circle class="svg_hole" cx="0" cy="-${this.R[h]}" r="150" transform="rotate(${360*l/H.xlength})" />`;}).join("");
        this.symbol     = f.map( (_,i) => { let [l,h]=G.split(i,H.xlength); return `<text class="svg_symbol" x="0" y="-${this.R[h]-60}" id=${"symbol_"+i} transform="rotate(${360*l/H.xlength})" />&nbsp;</text>`;}).join("");
        this.upper      = f.map( (_,i) => { let [l,h]=G.split(i,H.xlength); return `<circle class="svg_click" cx="0" cy="-${this.R[h]}" r="150" id=${"upper_"+i} transform="rotate(${360*l/H.xlength})" onmouseover="this.style.stroke='red'" onmouseout="this.style.stroke='black'"/>`;}).join("");
    }
}

class GardenView_OffsetCircle extends GardenView {
    configure() {
        let f = G.foxes ; // to get a "foxes" long array, we don't actually use the data now

        // Radii
        this.R = [(150*2+100)*H.xlength/(2*Math.PI)];
        for ( let y = 1 ; y < H.ylength ; ++y ) {
            this.R[y]=150+((this.R[y-1]+50)/Math.cos(Math.PI/H.xlength));
        } 
        this.total_radius = this.R[H.ylength-1]+200 ; // For inner circle radius plus layers, plus boundary

        this.vb = { // svg viewBox dimensions
            x: -this.total_radius,
            y: -this.total_radius,
            width: 2*this.total_radius,
            height: 2*this.total_radius,
        };
        this.background = `<circle cx="0" cy="0" r="${this.R[H.ylength-1]}" class="svg_boundary" />`;

        // Foxholes lower (has background) symbol (holds inhabitant) upper (for click and border)
        this.lower      = f.map( (_,i) => { let [l,h]=G.split(i,H.xlength); return `<circle class="svg_hole" cx="0" cy="-${this.R[h]}" r="150" transform="rotate(${360*(l+.5*(h&1))/H.xlength})"/>`;}).join("");
        this.symbol     = f.map( (_,i) => { let [l,h]=G.split(i,H.xlength); return `<text class="svg_symbol" x="0" y="-${this.R[h]-60}" id=${"symbol_"+i} transform="rotate(${360*(l+.5*(h&1))/H.xlength})"/>&nbsp;</text>`;}).join("");
        this.upper      = f.map( (_,i) => { let [l,h]=G.split(i,H.xlength); return `<circle class="svg_click" cx="0" cy="-${this.R[h]}" r="150" id=${"upper_"+i} transform="rotate(${360*(l+.5*(h&1))/H.xlength})" onmouseover="this.style.stroke='red'" onmouseout="this.style.stroke='black'"/>`;}).join("");
    }
}

class GardenView_Grid extends GardenView {
    configure() {
        let f = G.foxes ;
        this.vb = { // svg viewBox dimensions
            x: -200,
            y: -250,
            width: 350*(H.xlength-1)+400,
            height: 350*H.ylength+400,
        };
        this.background = `<rect class="svg_boundary" x="0" y="0" width="${350*(H.xlength-1)}" height="${350*(H.ylength-1)}"/>`;
        this.transform  = f.map( (_,i) => { let [l,h]=G.split(i,H.xlength); return `transform="translate(${l*350},${h*350})"`} ) ;

        // Foxholes lower (has background) symbol (holds inhabitant) upper (for click and border)
        this.lower      = f.map( (_,i) => `<circle class="svg_hole" cx="0" cy="0" r="150" ${this.transform[i]} />`)
                           .join("");
        this.symbol     = f.map( (_,i) => `<text class="svg_symbol" x="0" y="60" id=${"symbol_"+i} ${this.transform[i]} >&nbsp;</text>`)
                           .join("");
        this.upper      = f.map( (_,i) => `<circle class="svg_click" cx="0" cy="0" r="150" ${this.transform[i]} id=${"upper_"+i}  onmouseover="this.style.stroke='red'" onmouseout="this.style.stroke='black'"/>`)
                           .join("");
    }
}

class GardenView_OffsetGrid extends GardenView {
    configure() {
        let f = G.foxes ;
        this.vb = { // svg viewBox dimensions
            x: -200,
            y: -250,
            width: 350*(H.xlength-1)+575,
            height: 303*H.ylength+400,
        };
        this.background = `<rect class="svg_boundary" x="0" y="0" width="${350*(H.xlength-1)+(O.real_offset?175:0)}" height="${303*(H.ylength-1)}"/>`;
        this.transform  = f.map( (_,i) => { let [l,h]=G.split(i,H.xlength); return `transform="translate(${l*350+(h&1)*175},${h*303})"`} ) ;

        // Foxholes lower (has background) symbol (holds inhabitant) upper (for click and border)
        this.lower      = f.map( (_,i) => `<circle class="svg_hole" cx="0" cy="0" r="150" ${this.transform[i]}/>`)
                           .join("");
        this.symbol     = f.map( (_,i) => `<text class="svg_symbol" x="0" y="60" id=${"symbol_"+i} ${this.transform[i]}>&nbsp;</text>`)
                           .join("");
        this.upper      = f.map( (_,i) => `<circle class="svg_click" cx="0" cy="0" r="150" ${this.transform[i]} id=${"upper_"+i}  onmouseover="this.style.stroke='red'" onmouseout="this.style.stroke='black'"/>`)
                           .join("");
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
        for ( let i = 1 ; i <= H.total ; ++i ) {
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

    check() {
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
        let s = this.symbols( G.history(G.day) );
        for ( let i = 0; i <= H.total ; ++i ) {
            let d = document.createElement("td");
            if ( i==0 ) {
                d.innerHTML = `Day ${G.day}`;
            } else if ( G.number == 0 ) {
                d.innerHTML = s[i-1];
            } else {
                d.innerHTML = s[i-1] + "<br>" ;
                let b = document.createElement("input");
                b.type = "checkbox";
                b.onclick = () => TV.check() ;
                b.setAttribute("data-n",i-1);
                d.appendChild(b);
            }
            r.appendChild(d);
        }
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

    symbols( obMove ) {
        // moves = list of inspection holes
        // poisons = list of poisoned holes
        // foxes = true/false fox occupation list
        // returns a symbol list
        if ( G.number == 0 && obMove.moves.length==0 ) {
            // victory
            return obMove.foxes.map( (_,i) => i&1 ? "&#128077;" : "&#128516;" ) ;
        } else {
            let s = obMove.foxes.map( f => f?"&#129418;":"&nbsp;" ) ;
            obMove.moves.forEach( m => s[m] = "&#128064;" );
            obMove.poisoned.forEach( p => s[p] = "&#9763;" );
            return s ;
        }
    } 

    add_history_row() { // historical row
        let prior = G.prior ;
        let r = document.createElement("tr");
        let s = this.symbols( prior );
        for ( let i = 0; i <= H.total ; ++i ) {
            let d = document.createElement("td");
            if ( i==0 ) {
                d.innerHTML = `Day ${G.day-1}`;
            } else {
                d.innerHTML = s[i-1] ;
            }
            r.appendChild(d);
        }
        this.tbody.appendChild(r);
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
        for ( let i = 1 ; i <= H.total ; ++i ) {
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
        let current_fox = Array(H.total).fill(true);
        let current_stats = Array(H.total).fill( 1. / H.xlength );
        this.fox_history = [current_fox] ;
        this.stats_history = [current_stats];
        this.inspections = [] ;
        TV.start() ;
    }

    poison_array(date=this.date) { // returns true/false array
        let p = Array(H.total).fill(false);
        if ( O.poison_days > 0 ) {
            this.inspections.slice(0,date).slice(-O.poison_days).forEach( d => d.forEach( i => p[i]=true ) ) ;
        }
        return p ; 
    }

    poison_list(date) { // returns just the elements as an array
        return this.poison_array(date).map( (p,i) => p?i:-1 ).filter( i => i>-1 ) ;
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

        let current_fox = Array(H.total).fill(false) ;
        let current_stats = Array(H.total).fill(0) ;

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

    history( date ) {
        let r = {
            moves: [],
            poisoned: [],
            foxes: Array(H.total).fill(true),
        };
        if ( date>=0 && date<=this.date) {
            r.moves = this.inspections[date]||[];
            r.poisoned = this.poison_list(date);
            r.foxes = this.fox_history[date];
        }
        return r;
    }

    get prior() {
        return this.history(this.date-1);
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

    mod( i, m ) { // modulo rather than remainder
        let r = i % m ;
        while ( r < 0 ) {
            r += Math.abs(m) ;
        }
        return r ;
    }

    wrap( i , m ) {
        let j = this.mod(i,m) ;
        while ( j > m ) {
            j -= Math.abs(m);
        }
        return j;
    }

    wrap_neighbors( i , m ) {
        return [ this.wrap(i+1,m), this.wrap(i-1,m) ];
    }

    limit( ar, m ) { // array ar
        return ar.filter( a => a>=0 && a<m );
    }

    limit_neighbors( i , m ) {
        return this.limit([i-1,i+1],m);
    }

    split( i, m ) { //return low to high
        let low = this.mod(i,m);
        return [ low, Math.round((i-low)/m) ];
    }

    combine( lo, hi, m ) {
        return hi * m + lo;
    }
}

class Game_Circle extends Game {
   constructor() {
        super() ;
        TV = new TableView() ;
        GV = new GardenView_Circle() ;
    }

    fox_moves (h) { // returns an array of landing spots
        let [ lo,hi ] = G.split( h, H.xlength ) ;
        return this.wrap_neighbors(lo,H.xlength).map(l=>[l,hi])
            .concat( this.limit_neighbors(hi,H.ylength).map(h=>[lo,h]) )
            .map( x=> this.combine( x[0], x[1], H.xlength ) );
    }
}

class Game_OffsetCircle extends Game {
   constructor() {
        super() ;
        TV = new TableView() ;
        GV = new GardenView_OffsetCircle() ;
    }

    fox_moves (holes) { // returns an array of landing spots
        let [ lo,hi ] = G.split( holes, H.xlength ) ;
        let r = this.wrap_neighbors( lo, H.xlength ).map( l=>[l,hi] ) ; // horizontal
        this.limit_neighbors( hi, H.ylength ) //vertical
            .forEach( h => [lo-(h&1),lo+1-(h&1)].forEach( l=>r.push( [this.wrap( l, H.xlength ),h]))
            );
        return r.map( x=> this.combine( x[0], x[1], H.xlength )) ;
    }
}

class Game_Grid extends Game {
   constructor() {
        super() ;
        TV = new TableView() ;
        GV = new GardenView_Grid() ;
    }

    fox_moves (h) { // returns an array of landing spots
        let [ lo,hi ] = G.split( h, H.xlength ) ;
        return  this.limit_neighbors(lo,H.xlength).map(l=>[l,hi])
            .concat( this.limit_neighbors(hi,H.ylength).map(h=>[lo,h]) )
            .map( x=> this.combine( x[0], x[1], H.xlength) );
    }
}

class Game_OffsetGrid extends Game {
   constructor() {
        super() ;
        TV = new TableView() ;
        GV = new GardenView_OffsetGrid() ;
    }

    fox_moves (holes) { // returns an array of landing spots
        let [ lo,hi ] = G.split( holes, H.xlength ) ;
        let r = this.limit_neighbors( lo, H.xlength ).map( l=>[l,hi] ) ; // horizontal
        this.limit_neighbors( hi, H.ylength ) //vertical
            .forEach( h => this.limit( [lo-(h&1),lo+1-(h&1)], H.xlength ).forEach( l => r.push( [l,h] ) )
            );
        return r.map( x=> this.combine( x[0], x[1], H.xlength )) ;
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
        this.is_garden = true; //default
        this.offset = false;
        this.real_offset = false; // offset and thick
    }

    classic() {
        // Parameters  -- standard game first
        this.geometry = "grid";
        this.visits = 1;
        this.poison_days = 0;
        this.width = 1;
        this.offset = false;
    }

    circle () {
        this.geometry = "circular";
        this.visits = 2;
        this.poison_days = 0;
        this.width = 1;
        this.offset = false;
    }

    poison() {
        this.geometry = "circular";
        this.visits = 1;
        this.poison_days = 1;
        this.width = 1;
        this.offset = false;
    }

    grid() {
        this.geometry = "grid";
        this.visits = 3;
        this.poison_days = 0;
        this.width = 2;
    }

    custom() {
        this.geometry = document.querySelector('input[name="arrange"]:checked').value;
        this.width = document.getElementById('width').value;
        this.visits = document.getElementById("holesper").value ;
        this.poison_days = document.getElementById("poisoneddays").value
        this.offset = document.getElementById("offset").checked;
    }

    fillin() { // updates rule and choose to match current game settings
        // holes
        document.getElementById("rholes").value = H.xlength;
        Cookie.set("holes",H.xlength);

        // visits
        document.getElementById("rvisits").value = this.visits;
        document.getElementById("holesper").value = this.visits;
        Cookie.set("visits", this.visits );

        // offset
        document.getElementById("offset").checked = this.offset;
        Cookie.set("offset", this.offset );


        // geometry
        switch (this.geometry) {
            case "circular":
                document.getElementById("rarrange").innerHTML = `The ${H.xlength} foxholes are arranged in a&{this.width>1?" thicker":""} &{this.real_offset?" offset":""} circle.`;
                break;
            case "grid":
            default:
                document.getElementById("rarrange").innerHTML = `The ${H.xlength} fox holes are arranged in a&{this.width>1?" thicker":""} &{this.real_offset?" offset":""} line. The fox cannot move past the edges.`;
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
            H.xlength = x ;
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
        x = Cookie.get("offset") ;
        if ( x ) {
            console.log(x);
            this.offset = x ;
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
            case "double":
                this.grid();
                break;
            default:
        }
        // fill in fields
        this.newgame();
    }
        
    hide() {
        ["svg_view","Ttable","choose","rules","BB_table","BB_garden","BB_layout","BB_rules","BB_choose","BB_history"].forEach( d => document.getElementById(d).style.display="none" );
    }

    layout() {
        this.hide() ;
        document.getElementById("svg_view").style.display="block";
        document.getElementById("BB_layout").style.display="inline-flex";
        GV.layout();
    }

    history() {
        this.hide() ;
        document.getElementById("svg_view").style.display="block";
        document.getElementById("BB_history").style.display="inline-flex";
        GV.history();
    }

    choose() {
        this.hide() ;
        document.getElementById("choose").style.display="block";
        document.getElementById("BB_choose").style.display="inline-flex";
    }

    rules() {
        this.hide() ;
        this.fillin();
        document.getElementById("rules").style.display="block";
        document.getElementById("BB_rules").style.display="inline-flex";
    }

    resume() {
        this.garden( this.is_garden ) ;
    }

    newgame() {
        H.ylength = this.width;
        this.real_offset = this.offset && (this.width>1) ;
        switch( this.geometry ) {
            case "circular":
                G = this.offset? new Game_OffsetCircle() : new Game_Circle() ;
                break ;
            case "grid":
            default:
                G = this.offset ? new Game_OffsetGrid() : new Game_Grid() ;
                break ;
            }
        this.garden(this.is_garden)
        G.start();
    }

    garden( is_garden ) {
        this.hide();
        this.is_garden = is_garden ;
        if ( is_garden ) {
            document.getElementById("svg_view").style.display="block";
            document.getElementById("BB_garden").style.display="inline-flex";
            document.getElementById("Bgarden1").style.backgroundColor = "white";
            document.getElementById("Bgarden2").style.backgroundColor = "white";
            document.getElementById("Btable1").style.backgroundColor = "grey";
            document.getElementById("Btable2").style.backgroundColor = "grey";
        } else {
            document.getElementById("Ttable").style.display="block";
            document.getElementById("BB_table").style.display="inline-flex";
            document.getElementById("Bgarden1").style.backgroundColor = "grey";
            document.getElementById("Bgarden2").style.backgroundColor = "grey";
            document.getElementById("Btable1").style.backgroundColor = "white";
            document.getElementById("Btable2").style.backgroundColor = "white";
        }
    }

    changeInput() {
        if ( H.change ) {
            this.newgame() ;
        }
    }
}
O = new Overlay();
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
