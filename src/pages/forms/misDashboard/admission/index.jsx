import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import axios from "../../../../services/Api.js";
import GridIndex from "../../../../components/GridIndex.jsx";
import useBreadcrumbs from "../../../../hooks/useBreadcrumbs.js";
import { useLocation } from "react-router-dom";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { IOSSwitch } from "../../chartsDashboard/IOSSwitch.js";

const ChartOptions = [
    { value: "column", label: "Column" },
    { value: "bar", label: "Bar" },
    { value: "line", label: "Line" },
    { value: "pie", label: "Pie" },
];

export default function AdmissionReportYearly() {
    const [tableColumns, setTableColumns] = useState([]);
    const [tableRows, setTableRows] = useState([]);
    const [chartData, setChartData] = useState({});
    const [selectedChart, setSelectedChart] = useState("line");
    const [isTableView, setIsTableView] = useState(true);
    const [loading, setLoading] = useState(false);
    const setCrumbs = useBreadcrumbs();
    const location = useLocation();
    const currAcYearId = location?.state;

    useEffect(() => {
        fetchYearlyAdmissionReportData();
        setCrumbs([
            { name: "MIS-Dashboard", link: "/mis-dashboard" },
            { name: "Admission" },
        ]);
    }, [currAcYearId]);

    const fetchYearlyAdmissionReportData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`api/admissionCategoryReport/getAdmissionCategoryReportAcademicYearWise?acYearId=${currAcYearId}`);
            const { data } = response?.data;
            updateTableAndChart(data || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const updateTableAndChart = (data) => {
        const getCategoryName = (item) => item.feeAdmissionType || item.fee_admission_category_type || "Unknown";

        const rows = data?.map((item, index) => ({
            id: index,
            quota: getCategoryName(item),
            intake: item.intake,
            admitted: item.admitted,
            vacant: item.vacant
        }));

        const totals = {
            id: 'total',
            quota: "Total",
            intake: data.reduce((sum, d) => sum + d.intake, 0),
            admitted: data.reduce((sum, d) => sum + d.admitted, 0),
            vacant: data.reduce((sum, d) => sum + d.vacant, 0)
        };
        rows.push(totals);

        setTableRows(rows);

        setTableColumns([
            { field: "quota", headerName: "Category Group Name", flex: 1, headerClassName: "header-bg" },
            { field: "intake", headerName: "Intake", type: "number", flex: 1, headerClassName: "header-bg", align: 'center' },
            { field: "admitted", headerName: "Admitted", type: "number", flex: 1, headerClassName: "header-bg", align: 'center' },
            { field: "vacant", headerName: "Vacant", type: "number", flex: 1, headerClassName: "header-bg", cellClassName: "last-column", align: 'center' }
        ]);

        setChartData({
            categories: data.map(d => getCategoryName(d)),
            intake: data.map(d => d.intake),
            admitted: data.map(d => d.admitted),
            vacant: data.map(d => d.vacant),
        });
    };

    const buildHighChartOptions = () => {
        const isPie = selectedChart === "pie";
        return {
            chart: {
                type: selectedChart,
                backgroundColor: "#f9f9f9",
                style: { fontFamily: "'Roboto', sans-serif" }
            },
            title: {
                text: "Yearly Admission Status by Category",
                style: { color: "#333" }
            },
            xAxis: !isPie ? {
                categories: chartData.categories || [],
                labels: { style: { color: "#333" } }
            } : undefined,
            yAxis: !isPie ? {
                min: 0,
                title: { text: "Count", style: { color: "#333" } },
                labels: { style: { color: "#333" } }
            } : undefined,
            // tooltip: { 
            //     shared: true,
            //     useHTML: true,
            //     backgroundColor: '#343a40',
            //     style: { color: '#fff' }
            // },
            tooltip: {
                shared: true,
                backgroundColor: "rgba(255,255,255,0.96)",
                borderWidth: 1,
                borderColor: "#e2e8f0",
                borderRadius: "6px",
                shadow: true,
                style: {
                    color: "#2d3748",
                    fontSize: "13px",
                    padding: "12px",
                    fontWeight: "500"
                },
                headerFormat: '<span style="font-size: 14px; font-weight: 600; color: #2d3748; margin-bottom: 8px; display: block">{point.key}</span>',
                pointFormat: '<div style="display: flex; align-items: center; margin: 4px 0;"><span style="background-color:{point.color}; width: 12px; height: 12px; border-radius: 2px; display: inline-block; margin-right: 8px;"></span><span style="font-weight: 500;">{series.name}:</span> <span style="font-weight: 700; margin-left: auto;">{point.y}</span></div>',
                useHTML: true
            },
            legend: {
                itemStyle: { color: '#333' }
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true,
                        style: { color: "#000", textOutline: "1px contrast" }
                    },
                    marker: { radius: 5, lineColor: "#fff", lineWidth: 1 }
                },
                column: {
                    dataLabels: {
                        enabled: true,
                        style: { color: "#000", textOutline: "1px contrast" }
                    }
                },
                bar: {
                    dataLabels: {
                        enabled: true,
                        style: { color: "#000", textOutline: "1px contrast" }
                    }
                },
                pie: {
                    allowPointSelect: true,
                    cursor: "pointer",
                    dataLabels: {
                        enabled: true,
                        format: "<b>{point.name}</b>: {point.y}",
                        color: "#000"
                    }
                }
            },
            credits: {
                enabled: false
            },
            series: isPie
                ? [
                    {
                        name: "Total",
                        // colorByPoint: true,
                        data: [
                            { name: "Intake", y: chartData.intake?.reduce((a, b) => a + b, 0), color: "#4e79a7" },
                            { name: "Admitted", y: chartData.admitted?.reduce((a, b) => a + b, 0), color: "#f28e2b" },
                            { name: "Vacant", y: chartData.vacant?.reduce((a, b) => a + b, 0), color: "#e15759" }
                        ]
                    }
                ]
                : [
                    { name: "Intake", data: chartData.intake, color: "#4e79a7" },
                    { name: "Admitted", data: chartData.admitted, color: "#f28e2b" },
                    { name: "Vacant", data: chartData.vacant, color: "#e15759" }
                ]
        };
    };

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
                    <Grid item xs={12} sm="auto">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body1">Chart view</Typography>
                            <FormControlLabel
                                control={
                                    <IOSSwitch
                                        ischecked={isTableView}
                                        handlechange={() => setIsTableView(!isTableView)}
                                    />
                                }
                                label="Table view"
                                labelPlacement="end"
                            />
                        </Stack>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Chart Type</InputLabel>
                            <Select
                                size="small"
                                value={selectedChart}
                                label="Chart Type"
                                onChange={(e) => setSelectedChart(e.target.value)}
                            >
                                {ChartOptions.map((obj, index) => (
                                    <MenuItem key={index} value={obj.value}>{obj.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Grid>

            <Grid item xs={12}>
                {isTableView ? (
                    <Grid
                        item
                        xs={12}
                        md={12}
                        lg={12}
                        pt={1}
                        sx={{
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: '#376a7d',
                                color: '#fff',
                                fontWeight: 'bold',
                            },
                            '& .last-row': {
                                fontWeight: 'bold',
                                backgroundColor: '#376a7d !important',
                                color: '#fff'
                            },
                            '& .last-row:hover': {
                                backgroundColor: '#376a7d !important',
                                color: '#fff'
                            },
                            '& .last-column': {
                                fontWeight: 'bold'
                            },
                            '& .header-bg': {
                                fontWeight: 'bold',
                                backgroundColor: '#376a7d',
                                color: '#fff'
                            }
                        }}
                    >
                        <GridIndex
                            rows={tableRows}
                            columns={tableColumns}
                            loading={loading}
                            getRowId={(row) => row.id}
                            isRowSelectable={() => false}
                            getRowClassName={(params) =>
                                params.row.quota === "Total" ? "last-row" : ""
                            }
                        />
                    </Grid>
                ) : (
                    <Box p={3}>
                        {chartData.intake && <HighchartsReact highcharts={Highcharts} options={buildHighChartOptions()} />}
                    </Box>
                )}
            </Grid>
        </Grid>
    );
}
