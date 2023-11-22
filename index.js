const axios = require('axios');
const { Parser } = require('json2csv');
const fs = require('fs');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url, retryCount = 0) {
    try {
        const response = await axios.get(url);
        if(response.data && response.data.data && response.data.data.list) return response.data;
        else throw new Error('Request failed');
        
    } catch (error) {
        if (retryCount < 3) { // Retry up to 3 times
            console.log(`Request failed, retrying in 60 seconds... (Attempt ${retryCount + 1})`);
            await sleep(60000); // Wait for 60 seconds
            return fetchPage(url, retryCount + 1);
        } else {
            throw error;
        }
    }
}

async function fetchAllPages(baseUrl, pageSize) {
    let allData = [];
    let page = 1;
    let totalCount = 0;

    do {
        const url = `${baseUrl}&page=${page}&page_size=${pageSize}`;
        const data = await fetchPage(url);

        if (data && data.data && data.data.list) {
            allData = allData.concat(data.data.list);
            totalCount = data.data.count;
        } else {
            throw new Error('Data format is not as expected');
        }
        console.log(page, allData.length, totalCount)
        page++;
    } while (allData.length < totalCount);

    return allData;
}

const baseUrl = 'https://www.geniidata.com/api/btc/inscription/search?content=%7B%22p%22:+%22tap%22,%22op%22:+%E2%80%9Cdmt-mint%22,%22dep%22:+%224d967af36dcacd7e6199c39bda855d7b1b37268f4c8031fed5403a99ac57fe67i0%22,%22tick%22:+%22nat%22,%22blk%22:+';
const pageSize = 100; // You can adjust the page size as needed

fetchAllPages(baseUrl, pageSize)
    .then(allData => {
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(allData);
        fs.writeFile('output.csv', csv, (err) => {
            if (err) {
                console.error('Error writing CSV file', err);
            } else {
                console.log('CSV file saved.');
            }
        });
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });
