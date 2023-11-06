/**
 * @namespace BUILD.API.LicenceApplication
 */

/**
 * Describes a restriction applied to (or to be applied to) a licence
 * class/grade combination.
 *
 * @typedef BUILD.API.LicenceApplication.ClassRestrictionDto
 * @memberOf BUILD.API.LicenceApplication
 * @name ClassRestrictionDto
 *
 * @property {number} licenceApplicationClassRestrictionId
 * @property {number} restrictionTypeId
 * @property {Date} fromDate
 * @property {Date} toDate
 * @property {Date} expiryDate
 * @property {string} description
 */

/**
 * A request to create a new licence application using the create
 * licence application API.
 *
 * @typedef BUILD.API.LicenceApplication.CreateApplicationRequest
 * @memberOf BUILD.API.LicenceApplication
 * @name CreateApplicationRequest
 *
 * @property {string} participantNumber
 * @property {boolean} applyApplicationFee
 * @property {boolean} applyCertificateFee
 * @property {boolean} applyRollFee
 * @property {boolean} certificateRequested
 * @property {BUILD.API.LicenceApplication.NewApplicationClassGradeDto[]} classGradeList
 * @property {number} financialCategoryId
 * @property {boolean} displayImageOnLicenceCard
 * @property {number} licencePeriod
 * @property {number} licenceTypeId
 * @property {string|undefined} notes
 */

/**
 * A single class/grade combination accepted by the create licence
 * application API.
 *
 * @typedef BUILD.API.LicenceApplication.NewApplicationClassGradeDto
 * @memberOf BUILD.API.LicenceApplication
 * @name NewApplicationClassGradeDto
 * @see BUILD.API.LicenceApplication.CreateApplicationRequest
 *
 * @property {number} licenceClassId
 * @property {number} licenceGradeId
 * @property {boolean} isFeeWaiver
 * @property {boolean} isMutualRecognition
 * @property {boolean} isOverseas
 */

/**
 * Describes a single licence class restriction type.
 *
 * @typedef BUILD.API.LicenceApplication.RestrictionTypeConfigDto
 * @memberOf BUILD.API.LicenceApplication
 * @name RestrictionTypeConfigDto
 * @see BUILD.API.LicenceApplication.ClassGradeConfigResponse
 *
 * @property {number} restrictionTypeId
 * @property {string} code
 * @property {string} description
 * @property {string} defaultText
 */

/**
 * Describes a single licence grade configuration for a new licence
 * application.
 *
 * @typedef BUILD.API.LicenceApplication.LicenceGradeConfigDto
 * @memberOf BUILD.API.LicenceApplication
 * @name LicenceGradeConfigDto
 * @see BUILD.API.LicenceApplication.ClassGradeConfigResponse
 *
 * @property {number} licenceGradeId
 * @property {string} code
 * @property {string} description
 * @property {number} defaultRestrictionId
 */

/**
 * A selected class/grade for a new or existing licence application.
 *
 * @typedef BUILD.API.LicenceApplication.SelectedClassGrade
 * @memberOf BUILD.API.LicenceApplication
 * @name GetClassGradesDto
 *
 * @property {number} licenceApplicationClassId
 * @property {number} licenceClassId
 * @property {number} licenceGradeId
 *
 * @property {boolean} isMutualRecognition
 * @property {boolean} isOverseas
 * @property {boolean} isFeeWaiver
 *
 * @property {BUILD.API.LicenceApplication.ClassRestrictionDto[]} restrictions
 */

/**
 * @typedef BUILD.API.LicenceApplication.FeesGetResponse
 * @memberOf BUILD.API.LicenceApplication
 * @name FeesGetResponse
 *
 * @property {number} applicationAdminFee
 * @property {number} applicationLicenceFee
 * @property {string} calculationNotes
 * @property {number} certificateFee
 */

/**
 * @typedef BUILD.API.LicenceApplication.ApplicationPeriodRefundDto
 * @memberOf BUILD.API.LicenceApplication
 * @name ApplicationPeriodRefundDto
 *
 * @property {string|null} expiryDate
 * @property {number} expiryPeriodYears
 * @property {number|null} licenceRenewalId
 * @property {number|null} newPeriodYears
 * @property {number} originalLicenceFee
 * @property {number} overPaymentNewApplication
 * @property {string} proRataDate
 * @property {number} refundLicenceFee
 * @property {number} refundPeriod
 * @property {number} refundUnusedPortionSubTotal
 * @property {string} renewalNumber
 * @property {string} startDate
 * @property {"Okay"|"InconsistentPeriods"} status
 */

/**
 * @typedef BUILD.API.LicenceApplication.CheckApplicationDto
 * @memberOf BUILD.API.LicenceApplication
 * @name CheckApplicationDto
 *
 * @property {number} applicationId
 * @property {boolean} isOutstandingDebtAuthorised
 * @property {boolean} isOverpaymentWriteOffAuthorised
 * @property {boolean} isWriteOffAuthorised
 * @property {BUILD.API.LicenceApplication.ApplicationPeriodRefundDto} licenceApplicationPeriodRefundDto
 * @property {OwnerBuilderPermitOtherSixYearValidsCheckResponseDto[]|null} ownerBuilderPermitOtherSixYearValids
 */

/**
 * @typedef BUILD.API.LicenceApplication.OwnerBuilderPermitOtherSixYearValidsCheckResponseDto
 * @memberOf BUILD.API.LicenceApplication
 * @name OwnerBuilderPermitOtherSixYearValidsCheckResponseDto
 *
 * @property {string} ownerBuilderPermitCreatedDate
 * @property {string} ownerBuilderPermitNumber
 * @property {number} participantId
 * @property {string} participantNumber
 */

/**
 * @typedef BUILD.API.LicenceApplication.ApplicationConfigGetResponse
 * @memberOf BUILD.API.LicenceApplication
 * @name ApplicationConfigGetResponse
 *
 * @property {number} licenceApplicationId
 * @property {number} licencePeriod
 * @property {number|undefined} financialCategoryId
 * @property {string|undefined} financialCategoryDescription
 * @property {string} applicationNumber
 * @property {string} status
 * @property {string} statusChangeDate
 * @property {string} applicationDate
 * @property {null|number} industryAssociationId
 * @property {null|string} industryAssociation
 * @property {boolean} isDisplayImageOnLicenceCard
 * @property {boolean} includeCertificate
 * @property {boolean} ownerBuilderExemptionGranted
 *
 * @property {number} participantId
 * @property {string} participantNumber
 * @property {int|undefined} participantFinancialCategoryId
 * @property {string|undefined} participantFinancialCategoryDescription
 * @property {number|undefined} netTangibleAssets
 * @property {number|undefined} allowableTurnover
 * @property {number|undefined} currentTurnover
 * @property {number|undefined} currentRatio
 *
 * @property {number} licenceTypeId
 * @property {string} licenceTypeDescription
 * @property {string} licenceTypeCode
 * @property {boolean} allowMutualRecognition
 * @property {boolean} allowMultipleClasses
 * @property {boolean} offerCertificateOption
 * @property {boolean} allowFeeWaiver
 * @property {boolean} allowOverseas
 * @property {boolean} allowApplicationLicencePeriodEdit
 * @property {boolean} allowApplicationFeeVariation
 * @property {boolean} showAmountOutstanding
 * @property {boolean} showLicenceAnnualReport
 * @property {boolean} showLicenceCardHistory
 * @property {boolean} showLicenceCertificates
 * @property {boolean} showLicenceChanges
 * @property {boolean} showLicenceCheckItems
 * @property {boolean} showLicenceCovenantor
 * @property {boolean} showLicenceFinancialReports
 * @property {boolean} showLicenceInsurance
 * @property {boolean} showLicenceNotes
 * @property {boolean} showLicenceQualifications
 * @property {boolean} showLicenceSites
 * @property {boolean} showInterstateLicence
 * @property {boolean} showProfessionalRegistrations
 * @property {boolean} showCardImageOption
 * @property {boolean} showOwnerBuilderExemption
 * @property {boolean} showParticipantFinancials
 */

/**
 * @typedef BUILD.API.LicenceApplication.GetConfigResponse
 * @memberOf BUILD.API.LicenceApplication
 * @name GetConfigResponse
 *
 * @property {BUILD.API.LicenceApplication.IndustryAssociationConfigDto[]} industryAssociations
 * @property {BUILD.API.LicenceApplication.InstitutionConfigDto[]} institutions
 * @property {BUILD.API.LicenceApplication.OccupationalLicenceTypeConfigDto[]} occupationalLicenceTypes
 * @property {string[]} interstateLicenceStates
 * @property {string[]} financialRatioTypes
 * @property {BUILD.API.LicenceApplication.QualificationTypeDto[]} qualificationTypes
 * @property {BUILD.API.FinancialReportTypeDto[]} financialReportTypes
 * @property {BUILD.API.FinancialReportExemptionOpinionDto[]} financialReportExemptionOpinions
 * @property {BUILD.API.FinancialReportQualifiedPersonTypeDto[]} financialReportQualifiedPersonTypes
 * @property {BUILD.API.LicenceApplication.QualificationTypeConfigDto[]} qualificationTypes
 * @property {BUILD.API.LicenceApplication.FinancialReportTypeDto[]} financialReportTypes
 * @property {BUILD.API.LicenceApplication.FinancialReportExemptionOpinionDto[]} financialReportExemptionOpinions
 * @property {BUILD.API.LicenceApplication.FinancialReportQualifiedPersonTypeDto[]} financialReportQualifiedPersonTypes
 */
/**
 * @typedef BUILD.API.LicenceApplication.IndustryAssociationConfigDto
 * @memberOf BUILD.API.LicenceApplication
 * @name IndustryAssociationConfigDto
 *
 * @property {number} industryAssociationId
 * @property {string} code
 * @property {string} description
 * @property {string} legislationId
 */
/**
 * @typedef BUILD.API.LicenceApplication.InstitutionConfigDto
 * @memberOf BUILD.API.LicenceApplication
 * @name InstitutionConfigDto
 *
 * @property {number} institutionId
 * @property {string} code
 * @property {string} description
 * @property {string} legislationId
 * @property {boolean} isActive
 * @property {boolean} allowProfessionalRegistrations
 */
/**
 * @typedef BUILD.API.LicenceApplication.OccupationalLicenceTypeConfigDto
 * @memberOf BUILD.API.LicenceApplication
 * @name OccupationalLicenceTypeConfigDto
 *
 * @property {number} occupationalLicenceTypeId
 * @property {string} code
 * @property {string} description
 * @property {string} legislationId
 * @property {boolean} isActive
 */
/**
 * @typedef BUILD.API.LicenceApplication.QualificationTypeConfigDto
 * @memberOf BUILD.API.LicenceApplication
 * @name QualificationTypeConfigDto
 *
 * @property {number} qualificationTypeId
 * @property {string} code
 * @property {string} description
 * @property {string} legislation
 */

/**
 * @typedef BUILD.API.LicenceApplication.FinancialCategoryDto
 * @memberOf BUILD.API.LicenceApplication
 * @name FinancialCategoryDto
 *
 * @property {number} financialCategoryId
 * @property {string} financialCategoryGroup
 * @property {string} code
 * @property {string} description
 * @property {boolean} isActive
 */

/**
 * @typedef BUILD.API.LicenceApplication.QualificationTypeDto
 * @memberOf BUILD.API.LicenceApplication
 * @name QualificationTypeDto
 *
 * @property {number} qualificationTypeId
 * @property {string} code
 * @property {string} description
 * @property {string|undefined} legislation
 */
/**
 * @typedef BUILD.API.LicenceApplication.FinancialReportTypeDto
 * @memberOf BUILD.API.LicenceApplication
 * @name FinancialReportTypeDto
 *
 * @property {number} financialReportTypeId
 * @property {string} code
 * @property {string} description
 */
/**
 * @typedef BUILD.API.LicenceApplication.FinancialReportExemptionOpinionDto
 * @memberOf BUILD.API.LicenceApplication
 * @name FinancialReportExemptionOpinionDto
 *
 * @property {number} financialReportExemptionOpinionId
 * @property {string} code
 * @property {string} description
 */
/**
 * @typedef BUILD.API.LicenceApplication.FinancialReportQualifiedPersonTypeDto
 * @memberOf BUILD.API.LicenceApplication
 * @name FinancialReportQualifiedPersonTypeDto
 *
 * @property {number} financialReportQualifiedPersonTypeId
 * @property {string} code
 * @property {string} description
 */


/**
 * @typedef BUILD.API.LicenceApplication.CheckItem
 * @memberOf BUILD.API.LicenceApplication
 * @name CheckItem
 *
 * @property {number} checkItemAnswerId
 * @property {string|null} comment
 * @property {string} description
 * @property {boolean} isAutoCheckItem
 * @property {boolean} isOverrideEnabled
 * @property {BUILD.API.Employee|null} overriddenBy
 * @property {string|null} overrideReason
 * @property {boolean|null} passed
 */

/**
 * Describes a class/grade attached to a licence application.  Returned
 * by the existing licence application get class/grades API.
 *
 * @typedef BUILD.API.LicenceApplication.GetClassGradesDto
 * @memberOf BUILD.API.LicenceApplication
 * @name GetClassGradesDto
 *
 * @see BUILD.API.LicenceApplication.SelectedClassGrade
 *
 * @property {number} licenceApplicationClassId
 * @property {number} licenceClassId
 * @property {number} licenceGradeId
 *
 * @property {string} status
 *
 * @property {string} licenceClassCode
 * @property {string} licenceGradeCode
 * @property {string} licenceClassDescription
 * @property {string} licenceGradeDescription
 *
 * @property {boolean} isMutualRecognition
 * @property {boolean} isOverseas
 * @property {boolean} isFeeWaiver
 *
 * @property {string} [provisionallyFinalisedDate]
 *
 * @property {BUILD.API.LicenceApplication.ClassRestrictionDto[]} restrictions
 * @property {BUILD.API.LicenceApplication.ClassGradeFinancialCategoryDto[]} allowedFinancialCategories
 */
/**
 * @typedef BUILD.API.LicenceApplication.ClassGradeFinancialCategoryDto
 * @memberOf BUILD.API.LicenceApplication
 * @name ClassGradeFinancialCategoryDto
 *
 * @property {number} licenceFinancialCategoryId
 * @property {string} description
 */

/**
 * Wrapper class used for updating an existing class grade on a licence
 * application.
 *
 * @typedef BUILD.API.LicenceApplication.ClassGradeUpdateItem
 * @memberOf BUILD.API.LicenceApplication
 * @name ClassGradeUpdateItem
 *
 * @property {number} licenceApplicationClassId
 * @property {number} [licenceGradeId]
 * @property {string} [status]
 * @property {boolean} [isMutualRecognition]
 * @property {boolean} [isOverseas]
 * @property {boolean} [isFeeWaiver]
 */

/**
 * @typedef BUILD.API.LicenceApplication.FeeChangeResponse
 * @memberOf BUILD.API.LicenceApplication
 * @name FeeChangeResponse
 *
 * @property {BUILD.API.LicenceApplication.FeesGetResponse} pre
 * @property {BUILD.API.LicenceApplication.FeesGetResponse} post
 */

/**
 * @typedef BUILD.API.LicenceApplication.FinancialTransaction
 * @memberOf BUILD.API.LicenceApplication
 * @name FinancialTransaction
 *
 * @property {string} transactionNumber
 * @property {string} description
 * @property {number} amount
 * @property {number} outstandingAmount
 * @property {Date} entryDate
 * @property {Date} postDate
 * @property {string} reason
 */


/**
 * @typedef BUILD.API.LicenceApplication.Note
 * @memberOf BUILD.API.LicenceApplication
 * @name Note
 *
 * @property {number} noteId
 * @property {string} message
 * @property {number} authorId
 * @property {string} authorName
 * @property {Date} createdDate
 * @property {BUILD.API.LicenceApplication.NoteComment[]} comments
 */
/**
 * @typedef BUILD.API.LicenceApplication.NoteComment
 * @memberOf BUILD.API.LicenceApplication
 * @name Note
 *
 * @property {string} message
 * @property {number} authorId
 * @property {string} authorName
 * @property {Date} createdDate
 */

/**
 * @typedef BUILD.API.LicenceApplication.UpdateApplicationRequest
 * @memberOf BUILD.API.LicenceApplication
 * @name UpdateApplicationRequest
 *
 * @property {boolean|null|undefined} isExemptionGranted
 * @property {number|null|undefined} financialCategoryId
 * @property {boolean|null|undefined} isCertificateRequested
 * @property {boolean|null|undefined} isDisplayImageOnLicenceCard
 * @property {number|null|undefined} licencePeriod
 * @property {boolean|null|undefined} applyApplicationFee
 * @property {boolean|null|undefined} applyCertificateFee
 * @property {boolean|null|undefined} applyRollFee
 */

/**
 * The response object from the new licence application
 * licence type config API.
 *
 * @typedef BUILD.API.LicenceApplication.TypesConfigGetResponse
 * @memberOf BUILD.API.LicenceApplication
 * @name GetLicenceApplicationTypesConfigDto
 *
 * @property {number} participantId
 * @property {BUILD.API.LicenceApplication.LicenceTypeConfigDto[]} licenceTypes
 * @property {number[]} licenceTypesWithOpenApplications
 */
/**
 * A single licence type config for a new application.
 *
 * @typedef BUILD.API.LicenceApplication.LicenceTypeConfigDto
 * @memberOf BUILD.API.LicenceApplication
 * @name LicenceTypeConfigDto
 * @see BUILD.API.LicenceApplication.TypesConfigGetResponse
 *
 * @property {number} licenceTypeId
 * @property {string} code
 * @property {string} description
 * @property {boolean} allowMultipleApplicationsInProgress
 * @property {boolean} allowMutualRecognition
 * @property {boolean} allowMultipleClasses
 * @property {boolean} offerCertificateOption
 * @property {boolean} allowFeeWaiver
 * @property {boolean} allowApplicationFeeVariation
 * @property {boolean} showLicenceNotes
 * @property {boolean} allowOverseas
 * @property {boolean} showCardImageOption
 */

/**
 * The response object from the new licence application
 * class/grade config API.
 *
 * @typedef BUILD.API.LicenceApplication.ClassGradeConfigResponse
 * @memberOf BUILD.API.LicenceApplication
 * @name GetLicenceApplicationConfigDto
 *
 * @property {BUILD.API.LicenceApplication.LicenceClassGradeConfigDto[]} licenceClassGrades
 * @property {BUILD.API.LicenceApplication.LicenceClassConfigDto[]} licenceClasses
 * @property {BUILD.API.LicenceApplication.LicenceGradeConfigDto[]} licenceGrades
 * @property {BUILD.API.LicenceApplication.RestrictionTypeConfigDto[]} restrictionTypes
 * @property {BUILD.API.LicenceApplication.CurrentClassGradeDto[]} currentlyHeldClassGrades
 * @property {BUILD.API.LicenceApplication.FeeWaiverDto[]} feeWaiverConfig
 */

/**
 * Links a single licence class ID, licence grade ID, and financial
 * requirement ID as part of the licence class/grade config API
 * response for new licence applications.
 *
 * @typedef BUILD.API.LicenceApplication.LicenceClassGradeConfigDto
 * @memberOf BUILD.API.LicenceApplication
 * @name LicenceClassGradeConfigDto
 * @see BUILD.API.LicenceApplication.ClassGradeConfigResponse
 *
 * @property {number} licenceClassId
 * @property {number} licenceGradeId
 * @property {number} financialRequirementId
 */

/**
 * Describes a single licence class configuration for a new licence
 * application.
 *
 * @typedef BUILD.API.LicenceApplication.LicenceClassConfigDto
 * @memberOf BUILD.API.LicenceApplication
 * @name LicenceClassConfigDto
 * @see BUILD.API.LicenceApplication.ClassGradeConfigResponse
 *
 * @property {number} licenceClassId
 * @property {string} code
 * @property {string} description
 * @property {boolean} allowFeeWaiver
 * @property {number[]} restrictionIds
 */

/**
 * Describes and already-held licence class/grade.
 *
 * @typedef BUILD.API.LicenceApplication.CurrentClassGradeDto
 * @memberOf BUILD.API.LicenceApplication
 * @name CurrentClassGradeDto
 * @see BUILD.API.LicenceApplication.ClassGradeConfigResponse
 *
 * @property {number} licenceClassId
 * @property {number} licenceGradeId
 * @property {string} licenceClassStatusTypeId
 */

/**
 * Describes the fee waiver configuration for a given licence class
 * and grade for a new licence application.
 *
 * @typedef BUILD.API.LicenceApplication.FeeWaiverDto
 * @memberOf BUILD.API.LicenceApplication
 * @name FeeWaiverDto
 * @see BUILD.API.LicenceApplication.ClassGradeConfigResponse
 *
 * @property {number} licenceClassId
 * @property {number|null} licenceGradeId
 * @property {boolean} isFeeWaiverDefault
 * @property {string|null} reason
 */

/**
 * @typedef BUILD.API.LicenceApplication.FinancialCategoriesGetResponse
 * @memberOf BUILD.API.LicenceApplication
 * @name FinancialCategoriesGetResponse
 *
 * @property {BUILD.API.LicenceApplication.GetFinancialCategoryDto[]} availableCategories
 *      The currently available financial categories given the supplied
 *      class/grades.
 * @property {BUILD.API.LicenceApplication.GetFinancialCategoryDto|undefined} currentCategory
 *      The participant's current financial category (if any).
 * @property {BUILD.API.LicenceApplication.FinancialRequirementAndCategoryDto[]} financialRequirements
 *      A list of financial requirements and their allowed financial
 *      categories.
 * @property {BUILD.API.LicenceApplication.GetFinancialCategoryDto[]} financialCategories
 *      All financial categories.
 */
/**
 * @typedef BUILD.API.LicenceApplication.GetFinancialCategoryDto
 * @memberOf BUILD.API.LicenceApplication
 * @name GetFinancialCategoryDto
 *
 * @property {number} financialCategoryId
 * @property {string} description
 * @property {string} groupName
 * @property {string} groupDescription
 */
/**
 * @typedef BUILD.API.LicenceApplication.FinancialRequirementAndCategoryDto
 * @memberOf BUILD.API.LicenceApplication
 * @name FinancialRequirementAndCategoryDto
 *
 * @property {number} financialRequirementId
 * @property {number[]} allowedFinancialCategoryIds
 */

/**
 * @typedef BUILD.API.LicenceApplication.QualificationDto
 * @memberOf BUILD.API.LicenceApplication
 * @name QualificationDto
 *
 * @property {number} qualificationId
 * @property {string} qualificationTypeCode
 * @property {string} description
 * @property {string} institution
 * @property {string} qualificationDate
 * @property {string} createdDate
 */

/**
 * @typedef BUILD.API.LicenceApplication.OwnerBuilderPermitHolderDto
 * @memberOf BUILD.API.LicenceApplication
 * @name OwnerBuilderPermitHolderDto
 *
 * @property {number} ownerBuilderPermitParticipantId
 * @property {number} associatedParticipantId
 * @property {string} associatedParticipantNumber
 * @property {string} associatedParticipantName
 * @property {number} applicationParticipantId
 * @property {number} licenceId
 * @property {string} licenceNumber
 * @property {boolean} isOnTitle
 * @property {boolean} isDirector
 * @property {string} createdDate
 */
 
 
/**
 * @typedef BUILD.API.LicenceApplication.ProfessionalRegistrationDto
 * @memberOf BUILD.API.LicenceApplication
 * @name ProfessionalRegistrationDto
 * @property {number|undefined} professionalRegistrationId
 * @property {string|undefined} certificateNumber
 * @property {date|undefined} expiryDate
 * @property {string|undefined} institutionId
 * @property {string|undefined} institutionName
 */


/**
 * @typedef BUILD.API.LicenceApplication.InstitutionConfigDto
 * @memberOf BUILD.API.LicenceApplication
 * @name InstitutionConfigDto
 * @property {number|undefined} institutionId
 * @property {string|undefined} code
 * @property {string|undefined} description
 * @property {string|undefined} legislationId
 * @property {boolean|undefined} isActive
 * @property {boolean|undefined} allowProfessionalRegistrations
 */


/**
 * @typedef BUILD.API.LicenceApplication.TitleSearchDto
 * @memberOf BUILD.API.LicenceApplication
 * @name TitleSearchDto
 * @property {number|undefined} ownerBuilderPermitTitleSearchId
 * @property {string|undefined} dealerNumber
 * @property {boolean|undefined} originalTitleSearch
 * @property {date|undefined} titleSearchDate
 * @property {string|undefined} titleHolders
 * @property {string|undefined} notes
 */
