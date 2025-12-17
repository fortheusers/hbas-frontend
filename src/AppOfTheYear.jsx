import React, { useEffect, useState } from 'react';
import { Spacer, Mobile } from './Utils';
import loader from './img/loader.gif';
import switchIcon from './img/switch.png';
import wiiuIcon from './img/wiiu.png';
import noicon from './img/noicon.png';
import moment from 'moment';
import { fetchPackages } from './AppList';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import queryString from 'query-string';

const AppOfTheYear = () => {
    // use platform from localStorage, default to switch
    const storedPlatform = window.localStorage.getItem("platform") || 'switch';

    // Generate list of years based on platform
    // Wii U goes back to 2016, Switch to 2018
    const currentYear = new Date().getFullYear();
    const getAvailableYears = (platform) => {
        const startYear = platform === 'wiiu' ? 2016 : 2018;
        const years = [];
        for (let year = currentYear; year >= startYear; year--) {
            years.push(year);
        }
        return years;
    };

    // Helper to get month names for a quarter
    const getQuarterMonths = (quarter) => {
        const quarterMonths = {
            'Q1': ['Jan', 'Feb', 'Mar'],
            'Q2': ['Apr', 'May', 'Jun'],
            'Q3': ['Jul', 'Aug', 'Sep'],
            'Q4': ['Oct', 'Nov', 'Dec']
        };
        return quarterMonths[quarter] || [];
    };

    const defaultState = {
        stats: {},
        packages: [],
        packageDetails: {},
        hasLoaded: false,
        topApps: [],
        isCalculating: true,
        selectedPlatform: storedPlatform,
        selectedYear: 2025,
        newAppsOnly: true,
        selectedPeriod: 'year' // 'year', 'Q1', 'Q2', 'Q3', 'Q4'
    };
    const [state, setState] = useState(defaultState);
    const { t } = useTranslation();

    function numFormat(count) {
        // format a number with commas
        return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Update URL when state changes
    useEffect(() => {
        const { selectedPlatform, selectedYear, newAppsOnly, selectedPeriod } = state;
        if (state.hasLoaded) {
            const params = {
                platform: selectedPlatform,
                year: selectedYear,
                filter: newAppsOnly ? 'new' : 'all',
                period: selectedPeriod
            };
            const queryStr = queryString.stringify(params);
            window.history.replaceState({}, '', `/app-of-the-year?${queryStr}`);
        }
    }, [state.selectedPlatform, state.selectedYear, state.newAppsOnly, state.selectedPeriod, state.hasLoaded]);

    // Confetti effect on page load!
    useEffect(() => {
        if (!state.isCalculating && state.topApps.length > 0) {
            // Fire confetti!
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            function randomInRange(min, max) {
                return Math.random() * (max - min) + min;
            }

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);

                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [state.isCalculating, state.topApps]);

    useEffect(() => {
        async function loadData() {
            // fetch async and save to state
            const allPackages = await fetchPackages();

            // get app details including repo for icon construction
            const packageDetails = allPackages.reduce((prev, pkg) => ({
                ...prev,
                [`${pkg.platform}/${pkg.name}`.toLowerCase()]: {
                    title: pkg.title,
                    count: pkg.app_dls,
                    properName: pkg.name,
                    platform: pkg.platform,
                    description: pkg.description,
                    author: pkg.author,
                    repo: pkg.repo,
                    name: pkg.name
                }
            }), {});

            // Parse URL parameters
            const parsed = queryString.parse(window.location.search);
            const { platform, year, filter, period } = parsed;

            const urlPlatform = platform || storedPlatform;
            const urlYear = year ? parseInt(year) : 2025;
            const urlNewAppsOnly = filter ? filter === 'new' : true;
            const urlPeriod = period || 'year';

            setState({
                ...state,
                packageDetails,
                hasLoaded: true,
                selectedPlatform: urlPlatform,
                selectedYear: urlYear,
                newAppsOnly: urlNewAppsOnly,
                selectedPeriod: urlPeriod
            });
        }
        if (!state.hasLoaded) {
            loadData();
        }
    }, [setState, state, storedPlatform]);

    useEffect(() => {
        async function calculateTopApps() {
            const { packageDetails, selectedPlatform, selectedYear, newAppsOnly, selectedPeriod } = state;
            if (!state.hasLoaded || Object.keys(packageDetails).length === 0) return;

            // Fetch the quarterly data file for the selected platform (just ONE fetch!)
            const fixedPlatform = selectedPlatform === "wiiu" ? "WiiU" : "Switch";
            const quarterlyUrl = `https://wiiubru.com/history/quarterly_${fixedPlatform}.json`;

            let quarterlyData = {};
            try {
                const response = await fetch(quarterlyUrl);
                quarterlyData = await response.json();
            } catch (e) {
                console.error(`Failed to fetch quarterly data for ${selectedPlatform}`, e);
                setState({
                    ...state,
                    topApps: [],
                    isCalculating: false
                });
                return;
            }

            // Filter packages by selected platform
            const packageKeys = Object.keys(packageDetails).filter(pkg => {
                const [platform] = pkg.split("/");
                return platform === selectedPlatform;
            });

            // Process each package using the quarterly data
            const appResults = packageKeys.map((pkg) => {
                const { properName } = packageDetails[pkg];

                if (!properName) {
                    console.error(`Failed to find package details for ${pkg}`);
                    return null;
                }

                // Find this app entry in the quarterly data
                const quarterlyKey = Object.keys(quarterlyData).find(key =>
                    key.toLowerCase().includes(properName.toLowerCase())
                );

                if (!quarterlyKey) {
                    return null; // No stats for this app
                }

                const appData = quarterlyData[quarterlyKey];

                // Determine which quarter (if any) the app was first added
                let firstQuarter = null;
                if (newAppsOnly) {
                    // Check if app existed in previous years
                    let existedBefore = false;
                    for (let year = 2016; year < selectedYear; year++) {
                        const prevYearData = appData[year.toString()];
                        if (prevYearData && Object.keys(prevYearData).length > 0) {
                            existedBefore = true;
                            break;
                        }
                    }

                    // If didn't exist before, find first quarter with activity in selected year
                    if (!existedBefore) {
                        const yearData = appData[selectedYear.toString()];
                        if (yearData) {
                            const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
                            for (let quarter of quarters) {
                                if (yearData[quarter] && yearData[quarter] > 0) {
                                    firstQuarter = quarter;
                                    break;
                                }
                            }
                        }
                    }
                }

                // Calculate downloads for the selected period
                let downloadsForPeriod = 0;
                const quarters = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

                const yearData = appData[selectedYear.toString()];
                if (yearData) {
                    // Populate quarterly totals
                    quarters.Q1 = yearData.Q1 || 0;
                    quarters.Q2 = yearData.Q2 || 0;
                    quarters.Q3 = yearData.Q3 || 0;
                    quarters.Q4 = yearData.Q4 || 0;

                    // Calculate downloads for selected period
                    if (selectedPeriod === 'year') {
                        downloadsForPeriod = quarters.Q1 + quarters.Q2 + quarters.Q3 + quarters.Q4;
                    } else {
                        // Specific quarter selected
                        downloadsForPeriod = quarters[selectedPeriod] || 0;
                    }
                }

                return {
                    pkg,
                    downloadsForPeriod,
                    quarters,
                    firstQuarter,
                    ...packageDetails[pkg]
                };
            });

            let validResults = appResults.filter(r => r !== null && r.downloadsForPeriod > 0);

            // Filter based on "new apps only" setting
            if (newAppsOnly) {
                if (selectedPeriod === 'year') {
                    // For full year, exclude apps that existed before this year
                    validResults = validResults.filter(r => r.firstQuarter !== null);
                } else {
                    // For specific quarter, only include apps first added in that quarter
                    validResults = validResults.filter(r => r.firstQuarter === selectedPeriod);
                }
            }

            // Sort by downloads and get top 10 (top 5 + runner ups 6-10)
            const topApps = validResults
                .sort((a, b) => b.downloadsForPeriod - a.downloadsForPeriod)
                .slice(0, 10);

            setState({
                ...state,
                topApps,
                isCalculating: false
            });
        }

        if (state.hasLoaded && state.isCalculating) {
            calculateTopApps();
        }
    }, [state, getQuarterMonths]);

    const handlePlatformChange = (newPlatform) => {
        // Save to localStorage
        window.localStorage.setItem("platform", newPlatform);

        // Reset state and recalculate
        setState({
            ...state,
            selectedPlatform: newPlatform,
            topApps: [],
            isCalculating: true
        });
    };

    const handleYearChange = (newYear) => {
        setState({
            ...state,
            selectedYear: parseInt(newYear),
            topApps: [],
            isCalculating: true
        });
    };

    const handlePeriodChange = (newPeriod) => {
        setState({
            ...state,
            selectedPeriod: newPeriod,
            topApps: [],
            isCalculating: true
        });
    };

    // const handleNewAppsToggle = () => {
    //     setState({
    //         ...state,
    //         newAppsOnly: !state.newAppsOnly,
    //         topApps: [],
    //         isCalculating: true
    //     });
    // };

    // loading state, while waiting for async fetch
    if (!state.hasLoaded || state.isCalculating) {
        return (
            <div className="AppList">
                <div className="left">
                    <img src={loader} alt="Calculating top apps..." style={{ width: 270, height: 130 }} />
                    <p style={{ marginLeft: 40 }}>
                        {state.hasLoaded ? `Calculating ${state.selectedYear} statistics...` : "Loading app data..."}
                    </p>
                </div>
            </div>
        );
    }

    const { topApps, selectedPlatform, selectedYear, newAppsOnly, selectedPeriod } = state;
    const availableYears = getAvailableYears(selectedPlatform);

    // Generate stats URL for the top 5 apps
    const startYear = new Date(`${selectedYear}-01-01T00:00:00`).getTime();
    const endYear = new Date(`${selectedYear}-12-31T23:59:59`).getTime();
    const statsParams = topApps.slice(0, 5).map(app => app.pkg).join(',');
    const statsGraphUrl = `/stats?apps=${statsParams}&time=${startYear}:${endYear}:false`;

    const platformIconSrc = selectedPlatform === 'switch' ? switchIcon : wiiuIcon;

    const periodTitle = selectedPeriod === 'year'
        ? `App of the Year ${selectedYear}`
        : `App of ${selectedPeriod} ${selectedYear}`;

    const headerInfo = (
        <div className="catTitle">
            🏆 {periodTitle}
        </div>
    );

    // Generate explanation text based on selected period
    // const periodText = selectedPeriod === 'year'
    //     ? 'throughout the year'
    //     : `during ${selectedPeriod} (${getQuarterMonths(selectedPeriod).join(', ')})`;

    const explanation = (
        <div style={{
            maxWidth: '800px',
            margin: '20px auto',
            padding: '5px',
            marginTop: '5px',
            textAlign: 'center'
        }}>
            <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '10px' }}>
                These are the top 5 most downloaded homebrew apps {newAppsOnly ? `that were added ${selectedPeriod === 'year' ? 'in' : 'during'} ` : ''}{selectedPeriod === 'year' ? selectedYear : `${selectedPeriod} ${selectedYear}`} for <strong>{selectedPlatform === 'switch' ? 'Switch' : 'Wii U'}</strong>,
                based on download statistics from our repositories! See the <a href="/stats">stats page</a> for more information on how this is calculated.
            </p>
        </div>
    );

    const platformSelector = (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '15px',
            marginTop: '10px',
            flexWrap: 'wrap'
        }}>
            <span style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'var(--text-color)',
                marginRight: '5px'
            }}>
                Platform:
            </span>
            <button
                onClick={() => handlePlatformChange('switch')}
                style={{
                    padding: '8px 20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    backgroundColor: selectedPlatform === 'switch' ? '#E60012' : 'var(--dropDownBgColor)',
                    color: selectedPlatform === 'switch' ? 'white' : 'var(--buttonColor)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
            >
                <img src={switchIcon} alt="Switch" style={{ width: '18px', height: '18px' }} />
                Switch
            </button>
            <button
                onClick={() => handlePlatformChange('wiiu')}
                style={{
                    padding: '8px 20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    backgroundColor: selectedPlatform === 'wiiu' ? '#009AC7' : 'var(--dropDownBgColor)',
                    color: selectedPlatform === 'wiiu' ? 'white' : 'var(--buttonColor)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
            >
                <img src={wiiuIcon} alt="Wii U" style={{ width: '18px', height: '18px' }} />
                Wii U
            </button>
        </div>
    );

    const yearSelector = (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '15px',
            marginTop: '10px',
            flexWrap: 'wrap'
        }}>
            <span style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'var(--text-color)',
                marginRight: '5px'
            }}>
                Year:
            </span>
            {availableYears.map(year => (
                <button
                    key={year}
                    onClick={() => handleYearChange(year)}
                    style={{
                        padding: '6px 14px',
                        fontSize: '14px',
                        fontWeight: selectedYear === year ? 'bold' : 'normal',
                        backgroundColor: selectedYear === year ? 'var(--buttonColor)' : 'var(--dropDownBgColor)',
                        color: selectedYear === year ? 'var(--dropDownBgColor)' : 'var(--buttonColor)',
                        border: '1px solid var(--buttonColor)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {year}
                </button>
            ))}
        </div>
    );

    // Period selector (Full Year / Q1-Q4)
    const periodSelector = (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '15px',
            marginTop: '10px',
            flexWrap: 'wrap'
        }}>
            <span style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'var(--text-color)',
                marginRight: '5px'
            }}>
                Period:
            </span>
            {['year', 'Q1', 'Q2', 'Q3', 'Q4'].map(period => (
                <button
                    key={period}
                    onClick={() => handlePeriodChange(period)}
                    style={{
                        padding: '6px 14px',
                        fontSize: '14px',
                        fontWeight: selectedPeriod === period ? 'bold' : 'normal',
                        backgroundColor: selectedPeriod === period ? 'var(--buttonColor)' : 'var(--dropDownBgColor)',
                        color: selectedPeriod === period ? 'var(--dropDownBgColor)' : 'var(--buttonColor)',
                        border: '1px solid var(--buttonColor)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {period === 'year' ? 'Full Year' : period}
                </button>
            ))}
        </div>
    );

    const newAppsToggle = (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '15px',
            marginTop: '10px',
            flexWrap: 'wrap'
        }}>
            <span style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'var(--text-color)',
                marginRight: '5px',
                marginLeft: '25px'
            }}>
                Filter:
            </span>
            <button
                onClick={() => setState({ ...state, newAppsOnly: false, topApps: [], isCalculating: true })}
                style={{
                    padding: '6px 16px',
                    fontSize: '14px',
                    fontWeight: !newAppsOnly ? 'bold' : 'normal',
                    backgroundColor: !newAppsOnly ? 'var(--buttonColor)' : 'var(--dropDownBgColor)',
                    color: !newAppsOnly ? 'var(--dropDownBgColor)' : 'var(--buttonColor)',
                    border: '1px solid var(--buttonColor)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                All Time
            </button>
            <button
                onClick={() => setState({ ...state, newAppsOnly: true, topApps: [], isCalculating: true })}
                style={{
                    padding: '6px 16px',
                    fontSize: '14px',
                    fontWeight: newAppsOnly ? 'bold' : 'normal',
                    backgroundColor: newAppsOnly ? 'var(--buttonColor)' : 'var(--dropDownBgColor)',
                    color: newAppsOnly ? 'var(--dropDownBgColor)' : 'var(--buttonColor)',
                    border: '1px solid var(--buttonColor)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                Newly Added in {selectedYear}
            </button>
        </div>
    );

    const statsGraphLink = topApps.length > 0 && (
        <div style={{
            textAlign: 'center',
            marginBottom: '30px'
        }}>
            <a
                href={statsGraphUrl}
                style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    backgroundColor: 'var(--dropDownBgColor)',
                    color: 'var(--buttonColor)',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    transition: 'all 0.3s',
                    border: '2px solid var(--buttonColor)'
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--buttonColor)';
                    e.target.style.color = 'var(--dropDownBgColor)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--dropDownBgColor)';
                    e.target.style.color = 'var(--buttonColor)';
                }}
                target="_blank"
            >
                📊 View Top 5 on Graph
            </a>
        </div>
    );

    const rankColors = [
        'goldenrod',  // Gold
        'gray',       // Silver
        '#CD7F32',  // Bronze
        '#4A90E2',
        '#9B59B6'
    ];

    const topAppsList = (
        <div style={{
            width: '100%',
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '20px'
        }}>
            {topApps.slice(0, 5).map((app, index) => {
                const rank = index + 1;
                const iconUrl = `${app.repo}/packages/${app.name}/icon.png`;

                return (
                    <div
                        key={app.pkg}
                        style={{
                            backgroundColor: 'var(--footerBackgroundColor)',
                            borderLeft: `8px solid ${rankColors[index]}`,
                            margin: '20px 0',
                            padding: '30px',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: '30px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}
                        // onMouseEnter={(e) => {
                        //     e.currentTarget.style.transform = 'translateX(10px)';
                        // }}
                        // onMouseLeave={(e) => {
                        //     e.currentTarget.style.transform = 'translateX(0)';
                        // }}
                        onClick={() => {
                            window.location.href = `/${app.platform}/${app.properName}`;
                        }}
                    >
                        {/* App icon and ranking badge */}
                        <div style={{
                            position: 'relative',
                            minWidth: '256px',
                            width: '256px',
                            height: '150px'
                        }}>
                            <img
                                src={iconUrl}
                                alt={app.title}
                                style={{
                                    width: '256px',
                                    height: '150px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    border: '3px solid var(--dropDownBgColor)'
                                }}
                                onError={(e) => {
                                    e.target.src = noicon;
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                bottom: '-5px',
                                right: '-5px',
                                width: '50px',
                                height: '50px',
                                backgroundColor: rankColors[index],
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '28px',
                                fontWeight: 'bold',
                                color: 'white',
                                border: '3px solid var(--main-background)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                            }}>
                                {rank}
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <h2 style={{
                                margin: '0 0 0 0',
                                padding: '0 0 0 0',
                                fontSize: '28px',
                                fontWeight: 'bold',
                                color: 'var(--text-color)',
                                border: 'none'
                            }}>
                                {app.title}
                            </h2>

                            <p style={{
                                margin: '5px 0',
                                fontSize: '16px',
                                color: 'var(--buttonColor)',
                                fontStyle: 'italic'
                            }}>
                                by {app.author}
                            </p>

                            {app.description && (
                                <p style={{
                                    margin: '10px 0',
                                    fontSize: '14px',
                                    color: 'var(--text-color)',
                                    opacity: 0.8,
                                    lineHeight: '1.4'
                                }}>
                                    {app.description.substring(0, 150)}{app.description.length > 150 ? '...' : ''}
                                </p>
                            )}

                            <div style={{
                                marginTop: '15px',
                                display: 'flex',
                                gap: '20px',
                                alignItems: 'center',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    color: rankColors[index]
                                }}>
                                    {numFormat(app.downloadsForPeriod)} downloads
                                </div>

                                <div style={{
                                    fontSize: '14px',
                                    color: 'var(--buttonColor)',
                                    textTransform: 'uppercase',
                                    padding: '5px 10px',
                                    backgroundColor: 'var(--dropDownBgColor)',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}>
                                    <img src={platformIconSrc} alt={app.platform} style={{ width: '16px', height: '16px' }} />
                                    {app.platform}
                                </div>
                            </div>

                            {/* Quarter counts */}
                            <div style={{
                                marginTop: '15px',
                                display: 'flex',
                                gap: '10px',
                                flexWrap: 'wrap'
                            }}>
                                {Object.entries(app.quarters).map(([quarter, count]) => (
                                    <div
                                        key={quarter}
                                        style={{
                                            fontSize: '12px',
                                            padding: '5px 10px',
                                            backgroundColor: 'var(--main-background)',
                                            border: '1px solid var(--dropDownBgColor)',
                                            borderRadius: '4px',
                                            color: 'var(--text-color)'
                                        }}
                                    >
                                        <strong>{quarter}:</strong> {numFormat(count)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    // Runner ups list (apps 6-10) - simple list format
    const runnersUpList = topApps.length > 5 && (
        <div style={{
            width: '100%',
            maxWidth: '1000px',
            margin: '0 0 0 0',
            marginBottom: '100px',
            padding: '20px'
        }}>
            <h3 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'var(--text-color)',
                marginBottom: '20px',
                textAlign: 'center'
            }}>
                Runner ups
            </h3>
            <div style={{
                backgroundColor: 'var(--footerBackgroundColor)',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                {topApps.slice(5, 10).map((app, index) => {
                    const rank = index + 6; // 6-10
                    return (
                        <div
                            key={app.pkg}
                            style={{
                                padding: '15px 10px',
                                borderBottom: index < 4 ? '1px solid var(--dropDownBgColor)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                transition: 'background-color 0.2s',
                                cursor: 'pointer'
                            }}
                            // onMouseEnter={(e) => {
                            //     e.currentTarget.style.backgroundColor = 'var(--dropDownBgColor)';
                            // }}
                            // onMouseLeave={(e) => {
                            //     e.currentTarget.style.backgroundColor = 'transparent';
                            // }}
                            onClick={() => {
                                window.location.href = `/${app.platform}/${app.properName}`;
                            }}
                        >
                            <div style={{
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: 'var(--buttonColor)',
                                minWidth: '30px'
                            }}>
                                #{rank}
                            </div>
                            <div style={{ flex: 1 }}>
                                <a
                                    href={`/${app.platform}/${app.properName}`}
                                    style={{
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        color: 'var(--text-color)',
                                        textDecoration: 'none'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {app.title}
                                </a>
                                <span style={{
                                    fontSize: '14px',
                                    color: 'var(--buttonColor)',
                                    marginLeft: '10px',
                                    fontStyle: 'italic'
                                }}>
                                    by {app.author}
                                </span>
                            </div>
                            <div style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: 'var(--buttonColor)',
                                whiteSpace: 'nowrap'
                            }}>
                                {numFormat(app.downloadsForPeriod)} downloads
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="AppList">
            <Mobile />
            {headerInfo}
            {explanation}
            <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
                {platformSelector}
                {yearSelector}
                <div className="mobile-controls" style={{ display: 'flex', justifyContent: 'center' }}>
                    {periodSelector}
                    {newAppsToggle}
                </div>
                {topApps.length > 0 ? (
                    <>
                        {topAppsList}
                        {statsGraphLink}
                        {runnersUpList}
                    </>
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <p>No download data available for {selectedYear}{newAppsOnly ? ' (new apps only)' : ''}!</p>
                    </div>
                )}
            </div>
            <Spacer />
        </div>
    );
};

export default AppOfTheYear;
