var user = function (connection) {
	const STATIC_CONN_LIB = new statementConstructor();
	const USER_TABLE = "HiMTA::User";

	/*
	        const USER = $.session.securityContext.userInfo.familyName ?
	            $.session.securityContext.userInfo.familyName + " " + $.session.securityContext.userInfo.givenName :
	            $.session.getUsername().toLocaleLowerCase(),
	*/

	function getNextval(sSeqName) {

		const statement = `select "${sSeqName}".NEXTVAL as "ID" from dummy`;

		const result = connection.executeQuery(statement);

		if (result.length > 0) {
			return result[0].ID;
		} else {
			throw new Error('ID was not generated');
		}
	}

	this.doGet = function () {
		const result = connection.executeQuery(`SELECT * FROM "${USER_TABLE}"`);

		$.response.status = $.net.http.OK;
		$.response.setBody(JSON.stringify(result));
		
	};

	this.doPost = function (oUser) {
		oUser.usid = getNextval("HiMTA::usid");

		const statement = STATIC_CONN_LIB.createPreparedInsertStatement(USER_TABLE, oUser);
		connection.executeUpdate(statement.sql, statement.aValues);

		connection.commit();
		$.response.status = $.net.http.CREATED;
		$.response.setBody(JSON.stringify(oUser));
	};

	this.doPut = function (oUser) {
		let sql = "";

		sql = `UPDATE "${USER_TABLE}" SET "name"='${oUser.name}' WHERE "usid"=${oUser.usid};`;
		$.trace.error("sql to update: " + sql);

		connection.executeUpdate(sql);

		connection.commit();
		$.response.status = $.net.http.OK;
		$.response.setBody('User updated');
	};

	this.doDelete = function (usid) {
		const statement = STATIC_CONN_LIB.createPreparedDeleteStatement(USER_TABLE, {
			usid: usid
		});
		connection.executeUpdate(statement.sql, statement.aValues);

		connection.commit();
		$.response.status = $.net.http.OK;
		$.response.setBody(JSON.stringify({}));
	};
};

var statementConstructor = function () {

	this.createPreparedInsertStatement = function (sTableName, oValueObject) {
		let oResult = {
			aParams: [],
			aValues: [],
			sql: "",
		};
		let sColumnList = '',
			sValueList = '';

		Object.keys(oValueObject).forEach(value => {
			sColumnList += `"${value}",`;
			oResult.aParams.push(value);
		});

		Object.values(oValueObject).forEach(value => {
			sValueList += "?, ";
			oResult.aValues.push(value);
		});

		sColumnList = sColumnList.slice(0, -1);
		sValueList = sValueList.slice(0, -2);

		oResult.sql = `insert into "${sTableName}" (${sColumnList}) values (${sValueList})`;

		$.trace.error("sql to insert: " + oResult.sql);
		return oResult;
	};

	this.createPreparedUpdateStatement = function (sTableName, oValueObject) {
		let oResult = {
			aParams: [],
			aValues: [],
			sql: "",
		};
		let sColumnList = '',
			sValueList = '';

		Object.keys(oValueObject).forEach(value => {
			sColumnList += `"${value}",`;
			oResult.aParams.push(value);
		});

		Object.values(oValueObject).forEach(value => {
			sValueList += "?, ";
			oResult.aValues.push(value);
		});

		sColumnList = sColumnList.slice(0, -1);
		sValueList = sValueList.slice(0, -2);

		oResult.sql = `UPDATE "${sTableName}" SET "name"='${oValueObject.name}' WHERE "usid"=${oValueObject.usid};`;

		$.trace.error("sql to update: " + oResult.sql);
		return oResult;
	};

	this.createPreparedDeleteStatement = function (sTableName, oConditionObject) {
		let oResult = {
			aParams: [],
			aValues: [],
			sql: "",
		};

		let sWhereClause = '';
		for (let key in oConditionObject) {
			sWhereClause += `"${key}"=? and `;
			oResult.aValues.push(oConditionObject[key]);
			oResult.aParams.push(key);
		}

		sWhereClause = sWhereClause.slice(0, -5);
		if (sWhereClause.length > 0) {
			sWhereClause = " where " + sWhereClause;
		}

		oResult.sql = `DELETE FROM "${sTableName}" ${sWhereClause}`;

		$.trace.error("sql to delete: " + oResult.sql);
		return oResult;
	};

};