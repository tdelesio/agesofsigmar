"use client"

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useState } from "react";
 
// Importing app.css is css file to add styling
//import "./App.css";
 
const VictoryPointTracker = () => {
    //  Counter is a state initialized to 0
    const [counter, setCounter] = useState(0);
 
    // Function is called everytime increment button is clicked
    const handleClick1 = () => {
        // Counter state is incremented
        setCounter(counter + 1);
    };
 
    // Function is called everytime decrement button is clicked
    const handleClick2 = () => {
        // Counter state is decremented
        setCounter(counter - 1);
    };
 
    return (


<div className="space-y-4">
        <Card key="vp-counter" className="bg-white text-black max-w-md overflow-hidden w-full mx-auto">
                  <CardHeader>
                    <CardTitle>Victory Points</CardTitle>
                    <CardDescription className="flex justify-between py-2"><span><Button  onClick={handleClick2}>- </Button></span><span className="text-lg">{counter}</span><span><Button onClick={handleClick1}>+</Button></span></CardDescription>
                  </CardHeader>
                </Card>
</div>

       
    );
};
 
export default VictoryPointTracker;