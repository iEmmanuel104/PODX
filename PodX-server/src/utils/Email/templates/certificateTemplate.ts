export const certificate = ( {name, propertyTitle, instructorName, date}: {name: string, propertyTitle: string, instructorName: string, date: string}) => {
  return `
        <!DOCTYPE html>
        <html lang="en">

        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Certificate of Completion</title>
            <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&family=Quattrocento&display=swap" rel="stylesheet" />
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
            <style>
                .font-quattrocento {
                    font-family: "Quattrocento", serif;
                }
                .font-open-sans {
                    font-family: "Open Sans", sans-serif;
                }
                .border-double {
                    border-style: double;
                }
                .border-thick {
                    border-width: 6px;
                }
                .border-thin {
                    border-width: 2px;
                }
                .tracking-wider-custom {
                    letter-spacing: 0.1em;
                }
                .name-border {
                    width: 100%;
                    border-bottom: 2px solid black;
                    padding-bottom: 0.2rem;
                    text-align: left;
                }
                .seal-image {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                .certificate-container {
                    width: 90%;
                    max-width: 95%;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                }
                .gold-text {
                    color: #b7791f;
                    font-weight: bold;
                }
                .content-left {
                    text-align: left;
                    padding-left: 10%;
                }
                .name {
                    font-size: 2.5rem;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                }
                .property-title {
                    font-size: 1.5rem;
                    margin-top: 0.5rem;
                }
            </style>
        </head>
        <body class="bg-gray-100 flex items-center justify-center min-h-screen">
            <div class="bg-white border-black border-thick border-double p-10 text-center relative shadow-lg certificate-container">
                <div class="border-black border-thin border-double p-10 relative">
                    <h1 class="font-quattrocento text-6xl text-bold mb-2 tracking-wider-custom gold-text">Certificate</h1>
                    <p class="font-open-sans text-2xl mb-4 tracking-wider-custom">of Completion</p>
                    <p class="font-open-sans text-xl mb-10 tracking-wider-custom content-left">We proudly present this certificate to</p>
                    <div class="content-left">
                        <h2 class="font-quattrocento name">${name}</h2>
                        <div class="name-border"></div>
                        <p class="font-open-sans text-xl mt-4 mb-2">for completing the property</p>
                        <p class="font-open-sans property-title font-bold">${propertyTitle}</p>
                    </div>
                    <div
                        class="absolute left-1/2 transform -translate-x-1/2 bottom-32 w-40 h-40 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden"
                    >
                        <img
                            src="https://res.cloudinary.com/drc6omjqc/image/upload/v1721073067/chain_breaker_lmjc02.webp"
                            alt="Seal"
                            class="seal-image"
                        />
                    </div>
                    <div class="flex justify-between items-center mt-32 pt-32">
                        <div class="text-center">
                            <p class="font-open-sans mb-2">${instructorName}</p>
                            <p class="border-t border-black w-48 mx-auto pt-1">Instructor</p>
                        </div>
                        <div class="text-center">
                            <p class="font-open-sans mb-2">${date}</p>
                            <p class="border-t border-black w-48 mx-auto pt-1">Date</p>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
};
