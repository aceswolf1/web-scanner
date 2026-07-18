# Web Scrapper UI Development

## Description

    - The web Scrapper will scrap products prices and will hold their price history.
    - The Web scrapper will have several modules, so the architecture should be decouble from each module, the first module is going to be the Pricing Tracker
    - The web scrapper will have a sidenav showcasing the different modules the web scrapper will have
    - The Web Scrapper should feature a dark/light theme with a button to toggle depending on the system preferences
    - The Web scrapper should feature purple and violet futuristic colors
    - The Web Scrapper design should have a good contrast ratio
    - Use Model Repository Service Controller architecture for this
        - List of modules:
            - Pricing Tracker:
                - The Pricing tracker will allow the user to:
                    - The user can search for items
                        - The search will search for name, source url or tags
                    - The user can create tags of items
                    - Create a new item
                    - Add different sources from in which the item is sold, example:
                        - User clicks a button called: Add new product
                        - A modal appears asking for the name of the Product
                        - An Image Url or uploaded the image manualy
                        - A checkbox to add tags to the item or create a new one
                        - Below the modal, there is a repeater, which will allow to add the different sources for this item:
                            - A Source have, an URL, Currency and once the url is analized, current price and a checkbok to mark this sources as the main price
                            - List of currencies:
                                - USD
                                - EUR
                                - GBP
                                - JPY
                                - CAD
                                - MXN
                                - COP
                            - The source will require the class name of the HTML object containing the price
                            - User might also add the css rule to reach that price
                            - If there is more than one coincidenses, warn the user
                            - The user can specify the father class container too
                            - The scrapper should be smart enough to identify:
                                - User only added a class name -> search for that class name
                                - User added also Father class name then search father classname and then the element
                                - User added css rule, then use that css rule to find the price element
                            - Users can only mark one source as Main
                        - The user click okay and a new card is displayer with the Name of the item, how many sources it has and a main price
                        - When the user clicks on the item, the user will see a new screen showing the name of the item, each source and a graph showing the price history of each source, each source should have a link to take the user to the initial source page url
                        - Each source will have displayed the time it was latest scrapped
                        - User can delete/edit a item -> Edit just the name but can also set a new main source
                        - User can delete sources
                        - User can add new sources
                        - User can set the item as favorite
                        - User can convert the prices into different currencies -> the conversion is only for practical porpuses but should not change the original currency, example:
                            - User visits Item A
                            - Item A has three resources
                            - Resource A's currency is COP
                            - Resource B's currency is USD
                            - Resources C's currency is CAD
                            - Inside on each currency, should be an small dropdown allowing to see the resources value in a different currency
                            - The displayed transformed currency
                            - User can add more resources after creating the item
                - The pricing Scrapper will scan for the price of each item every 8 hours
                - The pricing scrapper will, on turning on, trigger an automatic scrap
                - The pricing scrapper will have a Favorites section which will displayed the pined items set as favorites
                - The pricing scrapper allows to scrap for prices with a button inside an Item
                - The pricing tracker will fetch the value of currencies when item conversion happen

## Tech Stack

    - All tech stack should be a docker container
        - The Web Scrapper tech stack will use the following -> Docker container
            - Nuxt 4
            - Tailwind
            - Vue 3
            - PrimveVue
            - TypeScript
            - Zod
            - For primeVue use the Material Theme: https://primevue.dev/theming/styled/ with violet primary color and surface mist.
        - PostgrestSql use prisma for the models -> Docker Container
        - Python scrapper -> Docker container
        - Extra stand alone container acting like S3 to store the images -> Docker container
        - Backend should be not the one in nuxt but also decouple for nuxt, instead, nuxt should call the api of the backend
        - The containers should allow CORS accordinly

## Resources:

    - How to Install PrimeVue with Nuxt:
        - https://primevue.dev/nuxt
        - https://primevue.dev/configuration/
    - How to add Tailwind to nuxt and primeVue: https://primevue.dev/tailwind/
    - How to create a web scraper: https://sites.google.com/view/mikes-tech-notes/how-to-scrape-product-prices-from-websites-using-python-a-complete-guide
    - Aditional Web Scrapper information: https://proxyscrape.com/blog/scraping-prices-from-websites
    - prisma documentation: https://www.prisma.io/docs
    - For currency up-to-date use: https://frankfurter.dev/ and https://github.com/lineofflight/frankfurter

## Design:

    -
