import { useEffect, useState } from 'react';
import { Text } from './elem';


export default function EventsHeader(props: any) {
    return <div style={{
        height: 100,
        fontSize: 32,
        color: "white",
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
        marginRight:15,marginLeft:15,
    }}>
        <Text>הי מרטין, בוקר טוב :)</Text>
    </div>
}