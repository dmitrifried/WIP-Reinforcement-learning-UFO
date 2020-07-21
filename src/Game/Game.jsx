import React, { useState, useEffect, useRef} from 'react'
import Two from 'two.js';
// import Ship from './ship.js';

export default function Game(props) {
    // const [state, setstate] = useState(initialState)
    const ref = useRef(null);

    useEffect(() => {
        Game.two = new Two({fullscreen: true, autostart: true});
        Game.two.makeCircle(50, 50, 40);
        Game.two.update();
        Game.two.appendTo(ref.current);
    })

    return (
        <div ref={ref}>
            
        </div>
    )
}