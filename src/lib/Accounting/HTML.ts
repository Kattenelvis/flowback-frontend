// Function to generate HTML file and serve it to the user
export const generateAndDownloadHTML = async (
	generateHTMLContent: () => BlobPart | Promise<BlobPart>
) => {
	// Generate HTML content
	const htmlContent = await generateHTMLContent();

	// Create a Blob object containing the HTML content
	const blob = new Blob([htmlContent], { type: 'text/html' });

	// Create a temporary URL for the Blob
	const url = URL.createObjectURL(blob);

	// Create a link element
	const link = document.createElement('a');

	// Set the href attribute to the Blob URL
	link.href = url;

	// Set the download attribute with the desired filename
	link.download = 'generated_html_file.html';

	// Programmatically click the link to trigger the download
	document.body.appendChild(link);
	link.click();

	// Clean up by revoking the Blob URL, once the browser has started the download
	setTimeout(() => URL.revokeObjectURL(url), 1000);

	// Remove the link element from the DOM
	document.body.removeChild(link);
};
