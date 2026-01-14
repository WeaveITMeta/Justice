# Justice System Directory Structure Creation Script
# Creates the complete 00-15 taxonomy structure

$baseDir = "e:\Justice"

# Define the complete directory structure
$directories = @(
    "00_Overview_and_Introduction",
    "00_Overview_and_Introduction\Justice_System_Maps_and_Diagrams",
    
    "01_Entry_into_the_System",
    "01_Entry_into_the_System\Law_Enforcement",
    "01_Entry_into_the_System\Law_Enforcement\Policies_and_Procedures",
    "01_Entry_into_the_System\Law_Enforcement\Training_and_Certification",
    "01_Entry_into_the_System\Law_Enforcement\Technology_and_Surveillance",
    "01_Entry_into_the_System\Law_Enforcement\Accountability_Mechanisms",
    
    "02_Prosecution_and_Pretrial",
    "02_Prosecution_and_Pretrial\Prosecutorial_Discretion",
    "02_Prosecution_and_Pretrial\Prosecutorial_Discretion\Charging_Policies",
    "02_Prosecution_and_Pretrial\Prosecutorial_Discretion\Declination_Rates",
    "02_Prosecution_and_Pretrial\Prosecutorial_Discretion\Progressive_Prosecution_Initiatives",
    
    "03_Adjudication_and_Trial",
    "03_Adjudication_and_Trial\Evidence",
    "03_Adjudication_and_Trial\Evidence\Forensic_Sciences",
    "03_Adjudication_and_Trial\Evidence\Forensic_Sciences\DNA_and_Biological",
    "03_Adjudication_and_Trial\Evidence\Forensic_Sciences\Firearms_and_Toolmarks",
    "03_Adjudication_and_Trial\Evidence\Forensic_Sciences\Digital_Forensics",
    "03_Adjudication_and_Trial\Evidence\Forensic_Sciences\Error_Rates_and_Validation",
    "03_Adjudication_and_Trial\Evidence\Expert_Witnesses",
    
    "04_Sentencing_and_Sanctions",
    "04_Sentencing_and_Sanctions\Alternative_Sanctions",
    "04_Sentencing_and_Sanctions\Alternative_Sanctions\Community-Based",
    "04_Sentencing_and_Sanctions\Alternative_Sanctions\Electronic_Monitoring",
    "04_Sentencing_and_Sanctions\Alternative_Sanctions\Fines_Fees_and_Debt",
    
    "05_Corrections_and_Incarceration",
    "05_Corrections_and_Incarceration\Rehabilitation_and_Programming",
    "05_Corrections_and_Incarceration\Rehabilitation_and_Programming\Substance_Use_Treatment",
    "05_Corrections_and_Incarceration\Rehabilitation_and_Programming\Mental_Health_Services",
    "05_Corrections_and_Incarceration\Rehabilitation_and_Programming\Educational_Programs",
    "05_Corrections_and_Incarceration\Rehabilitation_and_Programming\Rehabilitative_Arts",
    
    "06_Reentry_and_Community_Supervision",
    "06_Reentry_and_Community_Supervision\Collateral_Consequences",
    "06_Reentry_and_Community_Supervision\Collateral_Consequences\Employment_Barriers",
    "06_Reentry_and_Community_Supervision\Collateral_Consequences\Housing_Restrictions",
    "06_Reentry_and_Community_Supervision\Collateral_Consequences\Civic_Rights_Loss",
    "06_Reentry_and_Community_Supervision\Collateral_Consequences\Family_Impact",
    
    "07_Victims_Rights_and_Support",
    "07_Victims_Rights_and_Support\Crisis_Support_Services",
    "07_Victims_Rights_and_Support\Legal_Assistance",
    "07_Victims_Rights_and_Support\Compensation_Programs",
    
    "08_Oversight_Accountability_and_Reform",
    "08_Oversight_Accountability_and_Reform\Reform_Proposals_and_Innovations",
    "08_Oversight_Accountability_and_Reform\Reform_Proposals_and_Innovations\Policing_Reform",
    "08_Oversight_Accountability_and_Reform\Reform_Proposals_and_Innovations\Pretrial_Reform",
    "08_Oversight_Accountability_and_Reform\Reform_Proposals_and_Innovations\Sentencing_Reform",
    "08_Oversight_Accountability_and_Reform\Reform_Proposals_and_Innovations\Corrections_Reform",
    "08_Oversight_Accountability_and_Reform\Reform_Proposals_and_Innovations\Reentry_Reform",
    
    "09_Civil_and_Administrative_Justice",
    "09_Civil_and_Administrative_Justice\Civil_Litigation",
    "09_Civil_and_Administrative_Justice\Family_and_Domestic",
    "09_Civil_and_Administrative_Justice\Immigration_and_Asylum",
    "09_Civil_and_Administrative_Justice\Administrative_Hearings",
    
    "10_Specialized_and_Alternative_Justice",
    "10_Specialized_and_Alternative_Justice\Problem-Solving_Courts",
    "10_Specialized_and_Alternative_Justice\Problem-Solving_Courts\Drug_Treatment",
    "10_Specialized_and_Alternative_Justice\Problem-Solving_Courts\Mental_Health",
    "10_Specialized_and_Alternative_Justice\Problem-Solving_Courts\Veterans",
    "10_Specialized_and_Alternative_Justice\Problem-Solving_Courts\Human_Trafficking",
    
    "11_Data_Research_and_Statistics",
    "11_Data_Research_and_Statistics\National_Databases",
    "11_Data_Research_and_Statistics\State_and_Local_Reports",
    "11_Data_Research_and_Statistics\Research_Papers_and_Journals",
    
    "12_Comparative_and_International",
    "12_Comparative_and_International\Country-Specific_Models",
    "12_Comparative_and_International\Country-Specific_Models\Nordic_Rehabilitation_Model",
    "12_Comparative_and_International\Country-Specific_Models\Portugal_Drug_Decriminalization",
    "12_Comparative_and_International\Country-Specific_Models\Restorative_Justice_in_New_Zealand",
    
    "13_Legislation_and_Policy",
    "13_Legislation_and_Policy\Federal",
    "13_Legislation_and_Policy\State",
    "13_Legislation_and_Policy\Model_Codes",
    "13_Legislation_and_Policy\Pending_Legislation",
    
    "14_Case_Law_and_Precedents",
    "14_Case_Law_and_Precedents\Landmark_Cases",
    "14_Case_Law_and_Precedents\Circuit_Splits",
    "14_Case_Law_and_Precedents\Recent_Decisions",
    
    "15_Resources_and_Tools",
    "15_Resources_and_Tools\Funding_and_Grants",
    "15_Resources_and_Tools\Training_Materials",
    "15_Resources_and_Tools\Software_and_Databases",
    "15_Resources_and_Tools\Advocacy_Organizations"
)

Write-Host "Creating Justice System directory structure..." -ForegroundColor Cyan

foreach ($dir in $directories) {
    $fullPath = Join-Path $baseDir $dir
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "Exists: $dir" -ForegroundColor Yellow
    }
}

Write-Host "`nDirectory structure creation complete!" -ForegroundColor Cyan
Write-Host "Total directories: $($directories.Count)" -ForegroundColor Cyan
