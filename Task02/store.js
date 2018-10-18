require('dotenv').config();
import fetch from 'node-fetch';
import moment from 'moment';
import { size } from 'lodash';


const TELOGIS_AUTHENTICATION_FAILURE = `Telogis authentication failure`;
const TELOGIS_API_INVOCATION_FAILURE = `Telogis API invocation failure`;
const TELOGIS_URL = `https://sysco.api.telogis.com/execute`;
//const TELOGIS_URL = `http://demo5839679.mockable.io/qa/route`;

const TELOGIS_USERNAME = process.env.USERNAME;
const TELOGIS_PASSWORD = process.env.PASSWORD;

let verbose = false;

let token = null;

const getAllJobs = async ({ opcoId, fromDate, toDate, routeStatus }) => {
    const jobResponse = await invokeTelogisEndpoint(
      `template=Job_RetrievePlanned_CX_6_test&opco=${opcoId}&fromDate=${fromDate}&toDate=${toDate}&routeState=${routeStatus}`
      //`template=Job_RetrievePlanned_CX_6_test&opco=045&fromDate=2018-04-10&toDate=2018-04-11&routeState=NotStarted`
      
    );
    //console.log(`template=Job_RetrievePlanned_CX_6_test&opco=${opcoId}&fromDate=${fromDate}&toDate=${toDate}&routeState=${routeStatus}`);
    verbose && console.log(
      'TelogisRepositoy getAllJobs: '
      //, jobResponse.Job_RetrievePlanned_CX_6.TableEntry
    );
    return jobResponse.Job_RetrievePlanned_CX_6_test.TableEntry;
};

  const invokeTelogisEndpoint = async formattedQueryParams => {
    const telogisUrl = process.env.TELOGIS_URL? process.env.TELOGIS_URL : TELOGIS_URL;
  
    const url = `${telogisUrl}?${formattedQueryParams}`;

    if (!token) {
      verbose && console.log(`Telogis token not found awaiting for token creation`);
      token = await getTelogisToken();
    } else {
      verbose && console.log(`Stored Telogis token [${token}] will be used`);
    }
  
   let response = await executeTelogisApiRequest(url);
  
    if (!response.ok) {
      if (response.status === 401) {
        verbose && console.log(`Authentication token has expired. Endpoint will be retried with a new token.`);
        token = await getTelogisToken();
      } else {
        verbose && console.error(`Unexpected response returned while executing Telogis API: [${url}] Status: ${response.status}`);
        throw new Error(TELOGIS_API_INVOCATION_FAILURE);
      }
    }
  
    response = await executeTelogisApiRequest(url);
  
    if (!response.ok) {
      verbose && console.error(`Unexpected response returned during retry of Telogis API: [${url}] Status: ${response.status}`
      );
      throw new Error(TELOGIS_AUTHENTICATION_FAILURE);
    }
  
    const responseJson = await response.json();
    return responseJson;
};

  const getTelogisToken = async () => {
    //return "test";
    let authResponse;
    try {
      authResponse = await fetch(`https://sysco.api.telogis.com/rest/login/${TELOGIS_USERNAME}/${TELOGIS_PASSWORD}`);
    } catch (e) {
      verbose && console.error(`Error occurred while authenticating with Telogis: ${e}`);
      throw new Error(TELOGIS_AUTHENTICATION_FAILURE);
    }
  
    if (!authResponse.ok) {
      verbose && console.error(`Unexpected response returned while authenticating with Telogis: ${authResponse.status}`);
      throw new Error(TELOGIS_AUTHENTICATION_FAILURE);
    }
  
    const authResponseJson = await authResponse.json();
  
    return authResponseJson.token;
};

const executeTelogisApiRequest = async url => {

  verbose && console.log(`Executing Telogis API: ${url}`);
    let response;
    try {
      response = await fetch(
        url.indexOf('?') === -1 ? `${url}?auth=${token}` : `${url}&auth=${token}`
      );
    } catch (e) {
      verbose && console.error(
        `Error occurred while executing Telogis API: [${url}] Error: ${e}`
      );
      throw new Error(TELOGIS_API_INVOCATION_FAILURE);
    }
    return response;
  };



export {
    getAllJobs
  };
  

