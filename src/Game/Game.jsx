import React, { useState, useEffect, useRef} from 'react'
import Two from 'two.js';
import Ship from './ship.js';

export default function Game(props) {
    // const [state, setstate] = useState(initialState)
    const ref = useRef(null);

    useEffect(() => {
        Game.two = new Two({fullscreen: true, autostart: true});
        new Ship({two: Game.two, x: 100, y: 100});
        Game.two.appendTo(ref.current);
    })

    return (
        <div ref={ref}>
            
        </div>
    )
}