// Carousel stub
import * as React from 'react'
export const Carousel = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)
Carousel.displayName = 'Carousel'
export const CarouselContent = Carousel
export const CarouselItem = Carousel
export const CarouselPrevious = Carousel
export const CarouselNext = Carousel
