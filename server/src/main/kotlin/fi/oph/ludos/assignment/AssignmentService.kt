package fi.oph.ludos.assignment

import jdk.jshell.spi.ExecutionControl.NotImplementedException
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class AssignmentService(val db: AssignmentRepository) {
    fun getAssignments(examType: ExamType): List<AssignmentOut> = when (examType) {
        ExamType.SUKO -> db.getSukoAssignments()
        ExamType.PUHVI -> db.getPuhviAssignments()
        ExamType.LD -> db.getLdAssignments()
    }

    fun createAssignment(assignment: Assignment): AssignmentOut = when (assignment) {
        is SukoAssignmentDtoIn -> db.saveSukoAssignment(assignment)
        is PuhviAssignmentDtoIn -> db.savePuhviAssignment(assignment)
        is LdAssignmentDtoIn -> db.saveLdAssignment(assignment)
        else -> throw UnknownError("Unreachable")
    }

    fun getAssignmentById(examType: ExamType, id: Int): AssignmentOut = when (examType) {
        ExamType.SUKO -> {
            try {
                db.getSukoAssignmentById(id)
            } catch (e: NotFoundException) {
                throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
            }
        }

        ExamType.PUHVI -> {
            try {
                db.getPuhviAssignmentById(id)
            } catch (e: NotFoundException) {
                throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
            }
        }

        ExamType.LD -> {
            try {
                db.getLdAssignmentById(id)
            } catch (e: NotFoundException) {
                throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
            }
        }
    }

    fun updateAssignment(examType: ExamType, id: Int, assignment: UpdateAssignmentDtoIn): Int {
        return when (examType) {
            ExamType.SUKO -> {
                try {
                    db.updateSukoAssignment(assignment as SukoUpdateAssignmentDtoIn, id)
                } catch (e: NotFoundException) {
                    throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
                }
            }

            ExamType.PUHVI -> {
                try {
                    db.updatePuhviAssignment(assignment as PuhviUpdateAssignmentDtoIn, id)
                } catch (e: NotFoundException) {
                    throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
                }
            }

            ExamType.LD -> {
                try {
                    db.updateLdAssignment(assignment as LdUpdateAssignmentDtoIn, id)
                } catch (e: NotFoundException) {
                    throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
                }
            }
        }
    }
}