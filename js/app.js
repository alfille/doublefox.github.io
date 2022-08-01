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
        window.onresize = () => this.dimension_control();
    }

    start() {
        this.history = [] ;
        this.arrowlist = G.foxes.map( (_,i) => G.fox_moves(i) ) ;
        this.allarrows = this.arrowlist.map( (m,i) => m.map( mm => `<line id=${"arr"+i+"_"+mm} x1="0" y1="0" x2="0" y2="0" class="svg_arrow" marker-end="url(#arrowhead)" visibility="hidden" />`).join("")
            ).join("");
        this.X = [] ; // coordinates of holes
        this.Y = [] ;
        this.symbol_list = [];
        this.vb = null ; // viewbox coordinates
    }

    back() {
        this.history.pop();
    }

    dimension_control() {
        let x = Math.min(this.svg.clientWidth,window.innerHeight-this.head.offsetHeight);
        this.svg.style.width = x+"px";
        this.svg.style.height = x+"px";
        if ( this.X.length == 0 ) {
            let Cx = parseInt(document.getElementById("upper_0").attributes.cx.value);
            let Cy = parseInt(document.getElementById("upper_0").attributes.cy.value);
            // get circle locations (get transform and calculate)
            G.foxes.forEach( (_,i) => {
                let mtx = document.getElementById("upper_"+i).transform.baseVal.consolidate().matrix ;
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
        this.set_boundary();
    }

    customize(s) {
        s.forEach( (ss,i) => document.getElementById("symbol_"+i).innerHTML = ss );
    }

    visibility() {
        G.foxes.forEach( (f,i) => this.arrowlist[i].forEach( m => document.getElementById("arr"+i+"_"+m).style.visibility= f?"visible":"hidden" ));
    }

    control_row(symbol_list) {
        this.symbol_list = symbol_list ;
        this.svg.innerHTML = this.create_svg() ;
        if ( this.vb == null ) {
            this.vb = ['x','y'].map( x => document.getElementById("svg_code").viewBox.baseVal[x] ) ;
        }
            
        if ( G.number !== 0 ) {
            G.foxes.forEach( (_,i)=>document.getElementById("upper_"+i).addEventListener('click', (e) => this.click(e.target)) );
        }
        this.dimension_control() ;
        this.customize(symbol_list) ;
        this.visibility() ;
        this.arrow_location();
    }

    click(target) {
        let hole = parseInt(target.id.split('_')[1]) ;
        TV.click(hole);
        console.log(target,hole,TV.checked(hole));
        target.style.strokeWidth = TV.checked(hole) ? "30" : "10" ;
    }

    layout() { // show layout of foxholes
        this.svg.innerHTML = this.create_svg(false) ;
        this.customize(G.foxes.map( (_,i) => i+"" ) ); // numbers not foxes
        this.arrow_location(); // yes arrows
        this.arrowlist.forEach( (m,i) => m.forEach( mm => document.getElementById("arr"+i+"_"+mm).style.visibility= "visible" ));
        
        this.svg.addEventListener('click', () => GV.post_layout() );
    }

    post_layout() {
        this.control_row(this.symbol_list) // restore fox symbols
        O.resume(); // back to table
    }

    Xmark() {
        return (this.vb==null) ?
            "" :
            `<text id="svg_x" x=${this.vb[0]} y=${this.vb[1]+100}>&#10006;</text><rect id="svg_xcover" x=${this.vb[0]} y=${this.vb[1]} width="110" height="110" />`
            ;
    }

    add_history_row(s) {
        this.history.push("");
    }

    set_boundary() {
    }        
}

class GardenView_Circular extends GardenView {
    start() {
        let f = G.foxes ; // to get a "foxes" long array, we don't actually use the data now

        this.total_radius = 350*(H.ylength-1) + 350*H.xlength/3 + 200 ; // For inner circle radius (pi=3) plus layers, plus boundary
        this.transform  = f.map( (_,i) => { let [l,h]=G.split(i,H.xlength); return `transform="rotate(${360*l/H.xlength}) translate(0,${350*h})"`;}) ;
        this.lower      = f.map( (_,i) => `<circle class="svg_hole" cx="0" cy="-${this.total_radius-200}" r="150" ${this.transform[i]}/>`).join("");
        this.symbol     = f.map( (_,i) => `<text class="svg_symbol" x="0" y="-${this.total_radius-200-60}" id=${"symbol_"+i} ${this.transform[i]}>&nbsp;</text>`).join("");
        this.upper      = f.map( (_,i) => `<circle class="svg_click" cx="0" cy="-${this.total_radius-200}" r="150" id=${"upper_"+i} ${this.transform[i]} onmouseover="this.style.stroke='red'" onmouseout="this.style.stroke='black'"/>`).join("");

        // history defs
        this.Htransform = f.map( (_,i) => { let [l,h]=G.split(i,H.xlength); return `transform="rotate(${360*l/H.xlength}) translate(0,${100*h})"`;}) ;
        this.Hradius = this.total_radius-400-350*(H.ylength-1);
        this.Hscale = (this.Hradius-100*H.ylength+50) / (this.Hradius+50) ;
        this.Hlower = f.map( (_,i) => `<circle class="old_hole" cx="0" cy="-${this.Hradius}" r="50"  ${this.Htransform[i]} />`).join("");

        super.start();
    }
    
    add_history_row(s) {
        let Tf = s.map( (ss,i) => `<text class="old_fox" x="0" y="-${this.Hradius-20}"  ${this.Htransform[i]}>${ss}</text><`).join("");
        this.history.push( `<circle cx="0" cy="0" r="${this.Hradius}" stroke="grey" stroke-width="3" fill="none" />${this.Hlower}${Tf}`);
    }
        
    show_history() {
        if ( this.history.length == 0 ) {
            return "";
        } else {
            return this.history.reduce( (t,x) => `<g transform="scale(${this.Hscale}) rotate(5)">${t}</g>${x}` );
        }
    }

    create_svg(show_history=true) {
        let Thist = show_history ? this.show_history() : this.Xmark() ; 
        return `<svg id="svg_code" viewBox="-${this.total_radius} -${this.total_radius} ${2*this.total_radius} ${2*this.total_radius}"> preserveAspectRatio="xMidYMid meet" width="100%"
            <circle cx="0" cy="0" r="${this.total_radius-200}" class="svg_boundary" />
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto" markerUnits="strokeWidth" >
                    <polygon points="0 0, 10 3.5, 0 7" />
                </marker>
            </defs>
            ${this.lower}
            ${this.allarrows}
            ${this.symbol}
            ${this.upper}
            ${Thist}
            Sorry, your browser does not support inline SVG.  
        </svg>` ;
    }
}

class GardenView_Grid extends GardenView {
    start() {
        let f = G.foxes ;
        this.transform  = f.map( (_,i) => { let [l,h]=G.split(i,H.xlength); return `transform="translate(${l*350},${h*350})"`} ) ;
        this.lower      = f.map( (_,i) => `<circle class="svg_hole" cx="0" cy="0" r="150" ${this.transform[i]}/>`)
                           .join("");
        this.symbol     = f.map( (_,i) => `<text class="svg_symbol" x="0" y="60" id=${"symbol_"+i} ${this.transform[i]}>&nbsp;</text>`)
                           .join("");
        this.upper      = f.map( (_,i) => `<circle class="svg_click" cx="0" cy="0" r="150" ${this.transform[i]} id=${"upper_"+i}  onmouseover="this.style.stroke='red'" onmouseout="this.style.stroke='black'"/>`)
                           .join("");
        this.Htransform = f.map( (_,i) => { let [l,h]=G.split(i,H.xlength); return `transform="translate(${l*350},${200+h*100+350*(H.ylength-1)})"`} ) ;
        this.Hlower     = f.map( (_,i) => `<circle class="old_hole" cx="0" cy="0" r="50"  ${this.Htransform[i]} />`).join("");

        super.start();
    }
    
    add_history_row(s) {
        let Tf = s.map( (ss,i) => `<text class="old_fox" x="0" y="25" ${this.Htransform[i]}>${ss}</text>`).join("");
        this.history.push( `<rect x1="0" y1="0" width="${350*(H.xlength-1)}" height="${100*(H.ylength-1)}" class="svg_hrect" ${this.Htransform[0]} />${this.Hlower}${Tf}` );
    }
        
    show_history() {
        if ( this.history.length == 0 ) {
            return "";
        } else {
            return this.history.reduce( (t,x) => `<g transform="translate(0,${5+100*H.ylength})">${t}</g>${x}` );
        }
    }

    set_boundary() {
        let r = document.querySelector(".svg_boundary");
        r.setAttribute( "x", this.X[0]+"" );
        r.setAttribute( "y", this.Y[0]+"" );
        r.setAttribute( "width", this.X[H.total-1]+"" );
        r.setAttribute( "height", this.Y[H.total-1]+"" );
    }

    create_svg(show_history=true) {
        let Thist = show_history ? this.show_history() : this.Xmark() ; 
        return `<svg id="svg_code" viewBox="-200 -250 ${350*(H.xlength-1)+400} 1300"> preserveAspectRatio="xMidYMid meet" width="100%"
            <rect class="svg_boundary" />
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto" markerUnits="strokeWidth" >
                    <polygon points="0 0, 10 3.5, 0 7" />
                </marker>
            </defs>
            ${this.lower}
            ${this.allarrows}
            ${this.symbol}
            ${this.upper}
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
        let s = this.symbols( [], G.poison_list, G.foxes );
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
        for ( let i = 1 ; i <= H.total ; ++i ) {
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
        let current_fox = Array(H.total).fill(true);
        let current_stats = Array(H.total).fill( 1. / H.xlength );
        this.fox_history = [current_fox] ;
        this.stats_history = [current_stats];
        this.inspections = [] ;
        TV.start() ;
    }

    get poison_list() { // returns just the elements as an array
        return this.poison_array().map( (p,i) => p?i:-1 ).filter( i => i>-1 ) ;
    }

    poison_array() { // returns true/false array
        let p = Array(H.total).fill(false);
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

    limit_neighbors( i , m ) {
        if ( m==1 ) {
            return [] ;
        }
        if ( i-1 < 0 ) {
            return [i+1];
        }
        if ( i+1 >= m ) {
            return [i-1] ;
        }
        return [i-1,i+1];
    }

    split( i, m ) { //return low to high
        let low = this.mod(i,m);
        return [ low, Math.round((i-low)/m) ];
    }

    combine( lo, hi, m ) {
        return hi * m + lo;
    }
}

class Game_Circular extends Game {
   constructor() {
        super() ;
        TV = new TableView() ;
        GV = new GardenView_Circular() ;
    }

    fox_moves (h) { // returns an array of landing spots
        let [ lo,hi ] = G.split( h, H.xlength ) ;
        return this.wrap_neighbors(lo,H.xlength).map(l=>[l,hi])
            .concat( this.limit_neighbors(hi,H.ylength).map(h=>[lo,h]) )
            .map( x=> this.combine( x[0], x[1], H.xlength ) );
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
    }

    classic() {
        // Parameters  -- standard game first
        this.geometry = "linear";
        this.visits = 1;
        this.poison_days = 0;
        this.width = 1;
    }

    circle () {
        this.geometry = "circular";
        this.visits = 2;
        this.poison_days = 0;
        this.width = 1;
    }

    poison() {
        this.geometry = "circular";
        this.visits = 1;
        this.poison_days = 1;
        this.width = 1;
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
    }

    fillin() { // updates rule and choose to match current game settings
        // holes
        document.getElementById("rholes").value = H.xlength;
        Cookie.set("holes",H.xlength);

        // visits
        document.getElementById("rvisits").value = this.visits;
        document.getElementById("holesper").value = this.visits;
        Cookie.set("visits", this.visits );

        // geometry
        switch (this.geometry) {
            case "grid":
                document.getElementById("rarrange").innerHTML = `The ${H.xlength} fox holes are arranged in a thicker line. The fox cannot move past the edges.`;
                break;
            case "circular":
                document.getElementById("rarrange").innerHTML = `The ${H.xlength} foxholes are arranged in a circle.`;
                break;
            case "linear":
            default:
                document.getElementById("rarrange").innerHTML = `The ${H.xlength} fox holes are arranged in a line. The fox cannot move past either end of the line.`;
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
        ["svg_view","Ttable","choose","rules"].forEach( d => document.getElementById(d).style.display="none" );
    }

    layout() {
        this.hide() ;
        document.getElementById("svg_view").style.display="block";
        GV.layout();
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

    resume() {
        this.garden( this.is_garden ) ;
    }

    newgame() {
        H.ylength = this.width;
        switch( this.geometry ) {
            case "grid":
            case "linear":
                G = new Game_Grid() ;
                break ;
            case "circular":
            default:
                G = new Game_Circular() ;
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
