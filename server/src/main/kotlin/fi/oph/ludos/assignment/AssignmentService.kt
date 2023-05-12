package fi.oph.ludos.assignment

import fi.oph.ludos.Exam
import fi.oph.ludos.koodisto.KoodistoName
import fi.oph.ludos.koodisto.KoodistoService
import org.springframework.cache.CacheManager
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class AssignmentService(val db: AssignmentRepository, val cacheManager: CacheManager, val koodistoService: KoodistoService) {
    fun getAssignments(exam: Exam, filters: AssignmentFilter?): List<AssignmentOut> = when (exam) {
        Exam.SUKO -> {
            // check that assignmentTypeKoodiArvo contains only numbers and commas
            if (filters?.assignmentTypeKoodiArvo != null) {
                val regex = Regex("[0-9,]+")
                if (!regex.matches(filters.assignmentTypeKoodiArvo)) {
                    throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid assignmentTypeKoodiArvo")
                }
            }

            db.getSukoAssignments(filters)
        }
        Exam.PUHVI -> db.getPuhviAssignments(filters)
        Exam.LD -> db.getLdAssignments(filters)
    }

    fun createAssignment(assignment: Assignment): AssignmentOut = when (assignment) {
        is SukoAssignmentDtoIn -> {
            if (!koodistoService.isKoodiArvoInKoodisto(KoodistoName.TEHTAVATYYPPI_SUKO, assignment.assignmentTypeKoodiArvo)) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Assignment type: ${assignment.assignmentTypeKoodiArvo} not found")
            }
            db.saveSukoAssignment(assignment)
        }
        is PuhviAssignmentDtoIn -> db.savePuhviAssignment(assignment)
        is LdAssignmentDtoIn -> db.saveLdAssignment(assignment)
        else -> throw UnknownError("Unreachable")
    }

    fun getAssignmentById(exam: Exam, id: Int): AssignmentOut = when (exam) {
        Exam.SUKO -> {
            try {
                db.getSukoAssignmentById(id)
            } catch (e: NotFoundException) {
                throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
            }
        }

        Exam.PUHVI -> {
            try {
                db.getPuhviAssignmentById(id)
            } catch (e: NotFoundException) {
                throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
            }
        }

        Exam.LD -> {
            try {
                db.getLdAssignmentById(id)
            } catch (e: NotFoundException) {
                throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
            }
        }
    }

    fun updateAssignment(exam: Exam, id: Int, assignment: UpdateAssignmentDtoIn): Int = when (exam) {
        Exam.SUKO -> {
            try {
                db.updateSukoAssignment(assignment as SukoUpdateAssignmentDtoIn, id)
            } catch (e: NotFoundException) {
                throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
            }
        }

        Exam.PUHVI -> {
            try {
                db.updatePuhviAssignment(assignment as PuhviUpdateAssignmentDtoIn, id)
            } catch (e: NotFoundException) {
                throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
            }
        }

        Exam.LD -> {
            try {
                db.updateLdAssignment(assignment as LdUpdateAssignmentDtoIn, id)
            } catch (e: NotFoundException) {
                throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
            }
        }
    }
}