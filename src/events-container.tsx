import { forwardRef, LegacyRef, useState } from "react";

//props.height is number of vh (vertical window height)
export const EventsContainer = forwardRef((props: any, ref:LegacyRef<HTMLDivElement>) => {
    const [animationPhase, setAnimationPhase] = useState<number>(0);

    const animationEnd = () => setAnimationPhase(phase => phase + 1);

    const viewPortHeight = (window.innerHeight * props.vhHeight) / 100;

    // calculate how many items to scroll from top:
    let elementsToScroll = 0;
    props.children && props.children.forEach((child: any) => {

        if (Array.isArray(child)) {
            elementsToScroll = child.length - 1; //for now all of them
            let sumHeightFromBottom = 0;
            //totalElementsHeight = child.reduce((sum, section) => section.props.itemHeightPixels + sum, 0)

            for (let i = child.length - 1; i >= 0; i--) {
                const childItem = child[i];
                if (Array.isArray(childItem)) {
                    // todo
                } else {


                    sumHeightFromBottom += child[i].props.itemHeightPixels;
                    if (sumHeightFromBottom > viewPortHeight) {
                        break;
                    } else {
                        elementsToScroll--;
                    }
                }
            }
        }
    });






    return <div style={{ overflow: "hidden", height: props.vhHeight + "vh" }}>
        <div
            ref={ref}
            style={{
                width: "100%",
                height: props.vhHeight + "vh",
                backgroundColor:props.backgroundColor || "#EBF0F2",
                overflowY: "auto",
                flexWrap: "nowrap",
                ...props.style,
            }}
        >
            {
                props.autoScroll === true ?
                    props.children.map((child: any) => {
                        if (Array.isArray(child)) {
                            return child.map((section, i) => (
                                <section
                                    className={animationPhase % 2 === 0 && i <= elementsToScroll ? "collapse" : ""}
                                    onAnimationEnd={i === elementsToScroll ? () => {
                                        setTimeout(animationEnd, 3000);
                                        setTimeout(animationEnd, 3500);
                                    } : undefined}

                                    style={{
                                        animationDelay: i * 4 + 's',
                                    }}
                                >
                                    {section}
                                </section>
                            ))
                        } else {
                            return child;
                        }
                    }) :
                    props.children
            }
        </div>
    </div>
});
