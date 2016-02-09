# ip-conn-webtask-firebase

A [webtask](https://webtask.io/), powered by [wt-cli](https://www.npmjs.com/package/wt-cli) from [auth0](https://webtask.io)
and [Firebase](https://www.firebase.com)

### Purpose

This webtask receives an IP address as http request parameter, and attempts to find a matching
 connection name according to its own internal mapping of known IP CIDR address ranges to connections.

Must receive a valid IPv4 or IPv6 IP address with a request.

If the IP address is successfully matched, the connection name is passed back in http response,
 otherwise the connection name passed back is "unknown". In either case, constitutes a 200 response code.

Success response:

```
{
  connection: <connection name>
}
```

No match found:

```
{
  connection: <unknown>
}
```

![run cmd](https://raw.githubusercontent.com/arcseldon/ip-conn-webtask-firebase/master/img/run.gif)


### Motivation

This project constitutes the enterprise edition to its sibling webtask [ip-conn-webtask](https://github.com/arcseldon/ip-conn-webtask)

Rather than pass the necessary CIDR to connection name mappings into the webtask as a `secret`, this webtask externalizes its
configuration into Firebase.

The consequences of doing this are:

- Improved configuration management
  -- live editing in the web browser via
  -- config deployments with zero disruption to the webtasks (no webtask creation is required)
- Scalability - by using targeted URL endpoints "map like" search characteristics are achievable providing efficent
look up speeds even with large numbers of CIDRs.
- This webtask could pave the way for some kind of SAAS although requirements would need to be clarified - consider this
an incomplete proof of concept only in that regards.


### Installation

Pre-requisites:

A working copy of node and npm installed. See [Node website](https://nodejs.org/en/) for instructions.
Install the latest version you can - this webtask was written using Node v5+ and NPM 3+ but should
work on earlier versions..

Install [wt-cli](https://www.npmjs.com/package/wt-cli):

Run:

```
wt init
```

Check the instructions at [webtask.io](https://webtask.io/) for further details if required on getting started with
the wt command line tooling.

Clone the repo:

```
git clone ip-conn-webtask
```

Next install NPM modules:

```
npm install
```

Build the project

```
npm run build
```

An account with [Firebase](https://www.firebase.com) This is extremely simple, and you can signup with Google account,
and you only need to have a (free) dev plan. There is no need to supply credit card info etc.

If new to Firebase, do the 5 minute tutorial, then create a new application (by pressing new app button).

Under **Security and Rules** of left-hand nav-bar paste the following:

```
{
    "rules": {
        ".read": "auth != null && auth.uid === '<FIREBASE_SECRET>'",
        ".write": "auth != null && auth.uid === '<FIREBASE_SECRET>'"
    }
}
```

![firebase security](https://raw.githubusercontent.com/arcseldon/ip-conn-webtask-firebase/master/img/firebase_security1.jpg)


Your FIREBASE_SECRET is located under the **Secrets** section on left-hand nav-bar.

![firebase secret](https://raw.githubusercontent.com/arcseldon/ip-conn-webtask-firebase/master/img/firebase_secret.jpg)

In the base of this project, copy `env`, and create a file called `.env`

It should look as follows:

FIREBASE_OVERWRITE=true<br/>
FIREBASE_URL=https://YOUR_APP_NAME.firebaseio.com<br/>
FIREBASE_TOKEN=YOUR_FIREBASE_SECRET<br/>
AUTH0_DOMAIN_URL=https://YOUR_PROFILE.auth0.com/user/ip<br/>
AUTH0_CONNECTION=YOUR_CONNNECTION<br/>

The reason for this, is that your sensitive information will be referenced as environment variables.
You could alternatively, just run the scripts with the above environment variables referenced.

The last two entries are only actually required for running a functional test / demo to ensure everything
working - see special section later in this readme for further details.

Ok, that's it!  Let's get setup out of the way next..

### Set up

Suppose you have information similar to below:

 Fabrikam => 83.29.4.2/16 => Connection: fabrikam-adfs<br/>
 Contoso => 99.2.4.28/32 => Connection: contoso-ping<br/>
 Microsoft => 44.2.4.3/16 => Connection: ms-azuread<br/>

 Ultimately, we want that information stored in Firebase in an efficient way for lookups.

 **ip-conn-webtask-firebase** completely automates this.

 The idea is as follows. Given the above, we could store down
 the configuration simply as a list.

 Place your mappings, in a CSV file named `mappings.csv` into the `build/tools` directory.

  * 83.29.4.2/16, fabrikam-adfs
  * 99.2.4.28/32, contoso-ping
  * 44.2.4.3/16, ms-azuread
  * 200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40, fabrikam-adfs-6
  * 60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6/40, contoso-ping-6
  * eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29/64, ms-azuread-6

From base of project, run:

```
 npm run help:loader
```

This should output something like:

```
 Usage: loader [options]

   Options:

     -h, --help                      output usage information
     -V, --version                   output the version number
     -g --ipv4GroupBy [ipv4GroupBy]  ipv4GroupBy
     -g --ipv6GroupBy [ipv6GroupBy]  ipv6GroupBy
     -t, --taskname [taskname]       The task name to register for webtask, required if using --deploy
     -d --deploy                     Do config deployment to firebase & deploy webtask

   Converts simple csv file with CIDR, Connection pairs into firebase config
   Example with options: --ipv4GroupBy by16bits --ipv6GroupBy by48bits --deploy
   Will group the ipv4 cidrs by first 16 bits and ipv6 cidrs by first 48 bits
   The --deploy will autodeploy the configuraiton to your firebase app
   Input file should be named mapping.csv, located at: /Users/arcseldon/work/github/auth0/ip-conn-webtask-firebase/build/tools/config.csv.
   Format, once per line:  cidr, connection_name
   Example line:  83.29.4.2/16, fabrikam-adfs
   For an example input file, see: /Users/arcseldon/work/github/auth0/ip-conn-webtask-firebase/build/tools/sample.csv
   Configuration output is written to: /Users/arcseldon/work/github/auth0/ip-conn-webtask-firebase/build/tools/output/configMap.json

```

To see all the project NPM run commands use:

```
npm run
```

There is a convenience shell script in the base of the project `loader.sh` - you can just run this to get started:

```
$ ./loader.sh
```

Your configuration should now be loaded into Firebase. Check your firebase application Data online, to ensure it uploaded correctly.

![firebase data](https://raw.githubusercontent.com/arcseldon/ip-conn-webtask-firebase/master/img/firebase_data.jpg)


#### Rationale:

So here is what we are trying to achieve:

In IPv4, each octet consists of a decimal number ranging from 0 to 255.
These numbers are typically separated by periods.
In IPv6, addresses are expressed as a series of eight 4-character hexadecimal numbers,
which represent 16 bits each (for a total of 128 bits).

The idea is to group IPv4 addresses by first 8, 16 or 24 bits - depending on Client CIDR reqs.
The idea is to group IPv6 addresses by first 16, 32, 48 bits - depending on Client CIDR reqs.

This will result in more performant lookup and reduce payload size over network when fetching
IP to Connection mappings - assuming here for example we are using an API service such as Firebase
to host our mappings data

Clients should tailor the groupedBy size according their own needs, typically taking lowest
possible value for each IP type.

Example command and outputs given below:

Lets say we have a config.csv containing:

```
83.29.4.2/16, fabrikam-adfs
200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40, fabrikam-adfs-6

```

Then running:

```
npm run loader -- --ipv4GroupBy none --ipv6GroupBy none
```

would give:

```
{
  "ipv4": [
    {
      "cidr": "83.29.4.2/16",
      "conn": "fabrikam-adfs"
    }
  ],
  "ipv6": [
    {
      "cidr": "200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40",
      "conn": "fabrikam-adfs-6"
    }
  ]
}
```

If instead, we ran:

```
 npm run loader -- --ipv4GroupBy by16bits --ipv6GroupBy by32bits
```

Then we get a configuration mapping of:

```
{
  "ipv4": {
    "83:29": [
      {
        "cidr": "83.29.4.2/16",
        "conn": "fabrikam-adfs"
      }
    ]
  },
  "ipv6": {
    "200b:af16": [
      {
        "cidr": "200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40",
        "conn": "fabrikam-adfs-6"
      }
    ]
  }
}
```

This means we can call firebase from our webtask with a URL tailored to match the groupBy sizes we selected for the config
both at the IPv4 and IPv6 levels eg.

```
https://<YOUR_APP_NAME>.firebaseio.com/ipv4/83:29
```

or

```
https://<YOUR_APP_NAME>.firebaseio.com/ipv6/200b:af16
```

In our contrived example, there are no gains, but if we had 100s, perhaps 1000s of records the performance differences are considerable.

Feel free to use the mockRunner tool to experiment with performance and configuration options.

```
npm run help:mockRunner
```

provides help instructions on usage:

```
Usage: mockRunner [options]

  Options:

    -h, --help                      output usage information
    -V, --version                   output the version number
    -c, --count <n>                 Number of each ip type to create, default 1000
    -g --ipv4GroupBy [ipv4GroupBy]  ipv4GroupBy
    -g --ipv6GroupBy [ipv6GroupBy]  ipv6GroupBy
    -t, --testfixtures              Add test fixtures in addition to requested data set

  Generates mock ipv4 and ipv6 data, optionally groupedBy bit count you want
  Count limit is 10000
  Output is written to: /your_project_path/ip-conn-webtask-firebase/build/test/tools/output/mockConfigMap.json
```

You can execute:

```
./mockRunner.sh
```

to get started, with some configuration settings already specified. This will generate 10000 unique IPv4 / IPv6 CIDRs to play with,
and also include the test fixtures needed so that Unit tests pointed at Firebase still work.

### Deploy

We will deploy using the wt-cli.

The format you need:

```
wt create build/main/ipconn.js --name iponn --secret 'FIREBASE=https://<YOUR_APP>|<FIREBASE_SECRET>|<ipv4GroupBy>|<ipv6GroupBy>' --json --prod
```

As you can see above, our code for the webtask is `build/main/ipconn.js`.<br/>

Breaking the `--secret` down:

 ```
 <endpoint>|<secret>|<ipv4GroupBy>|<ipv6GroupBy>
 ```

 **endpoint** = your application firebase URL

 **secret** = your firebase secret as described earlier in this readme

 **ipv4GroupBy** = how many bits you wish to allocate to IPv4 CIDRs as the key lookup for your config - choice of (none|by8bits|by16bits|by24bits)

 **ipv6GroupBy** = how many bits you wish to allocate to IPv6 CIDRs as the key lookup for your config - choice of (none|by16bits|by32bits|by48bits)


When you run the `wt` command successfully, it will print a URL to the console. Copy this, and follow the Run instructions next.


# Run

To test, run this URL with an IP address query parameter.
You can use a command line tool like `curl` for this purpose.

For example:

```
curl https://webtask.it.auth0.com/api/run/wt-arcseldon-gmail_com-0/ipconn?ip=83.29.4.6
```

Using an IP that will match one of your CIDR / Connection name mappings, you should receive a response like:

```
{"connection":"fabrikam-adfs"}
```

For an unknown IP address you will see:

```
{"connection":"unknown"}
```

True errors will be reported as such.

Please contact your Auth0 representative if you require any further assistance.

### Demo / Functional Testing

You should have already copied the `env` file in base of the project, to `.env`.

You need to make sure these two entries are populated, for example:

AUTH0_DOMAIN_URL=https://your_profile_name.auth0.com/user/ip<br/>
AUTH0_CONNECTION=twitter<br/>

Then run:

```
$ ./demo.sh
```

This should:

Retrieve your IP as known to Auth0 (this also works running over VPN etc)<br/>
Inject that IP into a sample config.csv<br/>
Create and deploy the webtask acording to sample config.csv<br/>
Create and execute a `curl` command to the webtask URL endpoint using your IP<br/>


Result should be the registered `connection name` you provided in `.env`

If you ensure that the `connection name` matches an actual Connection you are using,
then you can then automaticaly login using that Connection via your custom login page.


### Note on O/S support:

This application was built using Mac OS X El Capitan v10.11.3, npm v.3.6.0, and node v5.5.0

The application should largely work untouched on Windows OS. However, the `postcompile` step needs `cp` changed to `copy`.

### Dev Details:

There are several supporting package.json script commands to support working with this code base.

The code is written using ES6 constructs, but nothing that is not supported by Node 5.5 out of the box.
In other words, although we use Babel to compile the ES6 Javascript from src/ to build/ directories, it
is quite possible to code and run the code directly from the src/ directory using Node 5.5 without any
babel / polyfill support. For this reason, opted not to use destructuring, default params, or ES6 modules
for this project. Also, I found no need for sourcemaps, for the reason given above, I can just comfortably
work directly from src.

That said, you can switch on compile watch and test watch, lint watch by running:

```
npm run watch:compile
npm run watch:test
npm run watch:lint
```

Also, I use Webstorm 11 IDE, and have quite a few conveniences set up to automate alot of tasks, but there are no dependencies etc on any given Editor / IDE.

The webtask has good test coverage, you can run:

```
npm run cov:test
```

to get some coverage metrics. Will be written to `coverage` directory - see *coverage/Icov-report/index.html* for details.

The main TestSuite will auto-populate Firebase on every run with a random selection of 3 different groupedBy sizes
for the same test fixture data. You can also use

```

FIREBASE_OVERWRITE=true
```

environment variable to switch off the overwrite behaviour. Just set to `false` (in .env file, or as declared).

I had intended to use [Proxyquire](https://www.npmjs.com/package/proxyquire) and/or [Nock](https://www.npmjs.com/package/nock) npm modules to stub out Firebase or change its URL responses thus removing any dependency on Firebase (live). However, this proved more complicated (there are various threads on the Internet detailing
the problems), and I didn't wish to introduce yet more dependencies (workaround npm modules created specifically for mocking firebase). Would revisit this, if this were more than a demonstration / prototype app only.


For specfic development questions or discovered bugs, please contact *Richard Seldon* at *arcseldon@icloud.com*
and feel free to raise an issue on the Auth0 github repository for this project. All our code is freely available
as open source.


