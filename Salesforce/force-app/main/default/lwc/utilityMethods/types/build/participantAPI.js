/**
 * @namespace BUILD.API.Participant
 */

/**
 * @typedef BUILD.API.Participant.InterstateLicenceDto
 * @memberOf BUILD.API.Participant
 * @name InterstateLicenceDto
 *
 * @property {number} interstateLicenceId
 * @property {string} participantNumber
 * @property {string} interstateLicenceNumber
 * @property {string} expiryDate
 * @property {string} licenceClass
 * @property {string} licenceGrade
 * @property {string} licenceConditions
 * @property {string} interstateLicenceState
 * @property {string} insuranceClaims
 * @property {string} licenceStatus
 * @property {string} statusReason
 * @property {string} statusDate
 * @property {string} createdDate
 */

/**
 * @typedef BUILD.API.Participant.OccupationalLicenceDto
 * @memberOf BUILD.API.Participant
 * @name OccupationalLicenceDto
 *
 * @property {number} occupationalLicenceId
 * @property {number} occupationalLicenceTypeId
 * @property {number} institutionId
 * @property {string} licenceNumber
 * @property {Date} expiryDate
 * @property {Date} createdDate
 *
 * @property {string} typeDescription
 * @property {string} typeCode
 * @property {string} institutionDescription
 * @property {string} institutionCode
 */

/**
 * @typedef BUILD.API.Participant.QualificationTypeConfigDto
 * @memberOf BUILD.API.Participant
 * @name QualificationTypeConfigDto
 *
 * @property {number} qualificationTypeId
 * @property {string} code
 * @property {string} description
 * @property {string} legislation
 */


/**
 * @typedef BUILD.API.Participant.QualificationDto
 * @memberOf BUILD.API.Participant
 * @name QualificationDto
 *
 * @property {number} qualificationId
 * @property {string} qualificationTypeCode
 * @property {string} description
 * @property {string} institution
 * @property {Date} qualificationDate
 * @property {Date} createdDate
 */

/**
 * @typedef BUILD.API.Participant.OccupationalLicenceRequest
 * @memberOf BUILD.API.Participant
 * @name OccupationalLicenceRequest
 *
 * @property {number} occupationalLicenceId
 * @property {number} occupationalLicenceTypeId
 * @property {number} institutionId
 * @property {string} licenceNumber
 * @property {Date} expiryDate
 */

/**
 * @typedef BUILD.API.Participant.GetLicenceQueryDto
 * @memberOf BUILD.API.Participant
 * @name GetLicenceQueryDto
 *
 * @property {number} licenceId
 * @property {number} participantId
 * @property {string} participantNumber
 * @property {number} licenceTypeId
 * @property {string} licenceTypeCode
 * @property {string} licenceTypeDescription
 * @property {string} licenceNumber
 * @property {boolean} isActive
 * @property {string} issueDate
 * @property {string} expiryDate
 * @property {BUILD.API.Participant.GetLicenceQueryClassGradeDto[]} classes
 */

/**
 * @typedef BUILD.API.Participant.GetLicenceQueryClassGradeDto
 * @memberOf BUILD.API.Participant
 * @name GetLicenceQueryClassGradeDto
 *
 * @property {number} licenceClassLicenceId
 * @property {number} licenceClassId
 * @property {number} licenceGradeId
 * @property {string} licenceClassCode
 * @property {string} licenceGradeCode
 * @property {string} licenceClassDescription
 * @property {string} licenceGradeDescription
 * @property {string} status
 * @property {boolean} isMutualRecognition
 * @property {boolean} isOverseas
 * @property {string} statusCode
 * @property {string} statusDescription
 * @property {string} statusType
 * @property {number} restrictionCount
 * @property {string} restrictions
 *
 */

/**
 * @typedef BUILD.API.Participant.GetLicenceQueryRestrictionDto
 * @memberOf BUILD.API.Participant
 * @name GetLicenceQueryRestrictionDto
 *
 * @property {number} restrictionTypeId
 * @property {string} fromDate
 * @property {string} toDate
 * @property {string} expiryDate
 * @property {string} description
 * @property {number} licenceRestrictionId
 */
